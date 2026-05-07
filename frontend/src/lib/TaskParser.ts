import * as chrono from "chrono-node";

export interface ParsedTask {
  title: string;
  due_date: string | null;       // ISO datetime string
  priority: "high" | "medium" | "low" | "urgent";
  labels: string[];
  recurring: string | null;      // human-readable rule e.g. "every monday"
  // tokens found — used for highlighting
  tokens: ParsedToken[];
}

export interface ParsedToken {
  type: "date" | "time" | "priority" | "label" | "recurring";
  raw: string;       // original text matched
  display: string;   // formatted display value
}

// ── Priority patterns ─────────────────────────────────────────────────────────
const PRIORITY_MAP: Record<string, ParsedTask["priority"]> = {
  p1: "high", "!1": "high", "high priority": "high", urgent: "high",
  p2: "medium", "!2": "medium", "medium priority": "medium",
  p3: "low", "!3": "low", "low priority": "low",
  p4: "urgent", "!4": "urgent", "no priority": "urgent",
};

const PRIORITY_REGEX = /\b(p[1-4]|![1-4]|urgent|high priority|medium priority|low priority|no priority)\b/gi;

// ── Label patterns ────────────────────────────────────────────────────────────
const LABEL_REGEX = /#([\w-]+)/g;

// ── Recurring patterns ────────────────────────────────────────────────────────
const RECURRING_PATTERNS: { regex: RegExp; label: string | ((m: RegExpMatchArray) => string) }[] = [
  { regex: /\bevery\s+day\b|\bdaily\b/i,                label: "Every day" },
  { regex: /\bevery\s+weekday\b|\bweekdays\b/i,         label: "Every weekday" },
  { regex: /\bevery\s+week\b|\bweekly\b/i,              label: "Every week" },
  { regex: /\bevery\s+month\b|\bmonthly\b/i,            label: "Every month" },
  { regex: /\bevery\s+year\b|\bannually\b|\byearly\b/i, label: "Every year" },
  {
    regex: /\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    label: (m: RegExpMatchArray) => `Every ${m[1].charAt(0).toUpperCase() + m[1].slice(1)}`,
  },
];

// ── Date/time display formatter ───────────────────────────────────────────────
function formatDateDisplay(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.getHours() !== 0 || date.getMinutes() !== 0
    ? ` ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
    : "";

  if (d.getTime() === today.getTime()) return `Today${timeStr}`;
  if (d.getTime() === tomorrow.getTime()) return `Tomorrow${timeStr}`;
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + timeStr;
}

// ── Main parser ───────────────────────────────────────────────────────────────
export function parseTask(input: string): ParsedTask {
  const tokens: ParsedToken[] = [];
  let working = input;

  // 1. Extract recurring rules first (before date parsing)
  let recurring: string | null = null;
  for (const { regex, label } of RECURRING_PATTERNS) {
    const match = working.match(regex);
    if (match) {
      recurring = typeof label === "function" ? (label as any)(match) : label;
      tokens.push({ type: "recurring", raw: match[0], display: recurring! });
      working = working.replace(match[0], " ").trim();
      break;
    }
  }

  // 2. Extract labels (#tag)
  const labels: string[] = [];
  const labelMatches = [...working.matchAll(LABEL_REGEX)];
  for (const m of labelMatches) {
    labels.push(m[1].toLowerCase());
    tokens.push({ type: "label", raw: m[0], display: `#${m[1]}` });
    working = working.replace(m[0], " ").trim();
  }

  // 3. Extract priority
  let priority: ParsedTask["priority"] = "medium";
  const priorityMatch = working.match(PRIORITY_REGEX);
  if (priorityMatch) {
    const key = priorityMatch[0].toLowerCase();
    priority = PRIORITY_MAP[key] ?? "medium";
    const displayMap: Record<ParsedTask["priority"], string> = {
      high: "P1", medium: "P2", low: "P3", urgent: "P4",
    };
    tokens.push({ type: "priority", raw: priorityMatch[0], display: displayMap[priority] });
    working = working.replace(priorityMatch[0], " ").trim();
  }

  // 4. Extract date/time using chrono-node
  let due_date: string | null = null;
  const parsed = chrono.parse(working, new Date(), { forwardDate: true });
  if (parsed.length > 0) {
    const result = parsed[0];
    const date = result.date();
    due_date = date.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
    tokens.push({
      type: result.start.isCertain("hour") ? "time" : "date",
      raw: result.text,
      display: formatDateDisplay(date),
    });
    working = working.replace(result.text, " ").replace(/\s+/g, " ").trim();
  }

  // 5. Clean up title — remove leftover punctuation/spaces
  const title = working
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,.-]+|[\s,.-]+$/g, "")
    .trim();

  return { title, due_date, priority, labels, recurring, tokens };
}

// ── Build highlighted segments for rendering ──────────────────────────────────
export interface Segment {
  text: string;
  token?: ParsedToken;
}

export function getSegments(input: string, tokens: ParsedToken[]): Segment[] {
  if (!tokens.length) return [{ text: input }];

  const segments: Segment[] = [];
  let remaining = input;

  // Sort tokens by their position in the original string
  const sorted = [...tokens].sort((a, b) => {
    const ia = input.toLowerCase().indexOf(a.raw.toLowerCase());
    const ib = input.toLowerCase().indexOf(b.raw.toLowerCase());
    return ia - ib;
  });

  for (const token of sorted) {
    const idx = remaining.toLowerCase().indexOf(token.raw.toLowerCase());
    if (idx === -1) continue;
    if (idx > 0) segments.push({ text: remaining.slice(0, idx) });
    segments.push({ text: remaining.slice(idx, idx + token.raw.length), token });
    remaining = remaining.slice(idx + token.raw.length);
  }

  if (remaining) segments.push({ text: remaining });
  return segments.filter((s) => s.text);
}
