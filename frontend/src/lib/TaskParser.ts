import * as chrono from "chrono-node";

export interface ParsedTask {
  title: string;
  due_date: string | null;
  priority: "high" | "medium" | "low" | "urgent";
  labels: string[];
  recurring: string | null;
  reminder_offset_min: number | null; // minutes before due_date to remind
  tokens: ParsedToken[];
}

export interface ParsedToken {
  type: "date" | "time" | "priority" | "label" | "recurring" | "reminder";
  raw: string;
  display: string;
}

// ── Priority ──────────────────────────────────────────────────────────────────
const PRIORITY_MAP: Record<string, ParsedTask["priority"]> = {
  p1: "high", "!1": "high", "high priority": "high", urgent: "high",
  p2: "medium", "!2": "medium", "medium priority": "medium",
  p3: "low", "!3": "low", "low priority": "low",
  p4: "urgent", "!4": "urgent", "no priority": "urgent",
};
const PRIORITY_REGEX = /\b(p[1-4]|![1-4]|urgent|high priority|medium priority|low priority|no priority)\b/gi;

// ── Labels ────────────────────────────────────────────────────────────────────
const LABEL_REGEX = /#([\w-]+)/g;

// ── Recurring ─────────────────────────────────────────────────────────────────
const RECURRING_PATTERNS: { regex: RegExp; label: string | ((m: RegExpMatchArray) => string) }[] = [
  { regex: /\bevery\s+day\b|\bdaily\b/i,                label: "Every day" },
  { regex: /\bevery\s+weekday\b|\bweekdays\b/i,         label: "Every weekday" },
  { regex: /\bevery\s+week\b|\bweekly\b/i,              label: "Every week" },
  { regex: /\bevery\s+month\b|\bmonthly\b/i,            label: "Every month" },
  { regex: /\bevery\s+year\b|\bannually\b|\byearly\b/i, label: "Every year" },
  {
    regex: /\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    label: (m) => `Every ${m[1].charAt(0).toUpperCase() + m[1].slice(1)}`,
  },
];

// ── Reminder patterns ─────────────────────────────────────────────────────────
// "remind me 30 min before" | "1 hour before" | "remind 1 day before" | "10 minutes before"
const REMINDER_PATTERNS: { regex: RegExp; mins: number | ((m: RegExpMatchArray) => number); display: string | ((m: RegExpMatchArray) => string) }[] = [
  {
    regex: /\b(?:remind(?:\s+me)?\s+)?(\d+)\s*(?:min(?:ute)?s?)\s+before\b/i,
    mins: (m) => parseInt(m[1]),
    display: (m) => `Remind ${m[1]}m before`,
  },
  {
    regex: /\b(?:remind(?:\s+me)?\s+)?(\d+)\s*(?:hours?)\s+before\b/i,
    mins: (m) => parseInt(m[1]) * 60,
    display: (m) => `Remind ${m[1]}h before`,
  },
  {
    regex: /\b(?:remind(?:\s+me)?\s+)?(\d+)\s*(?:days?)\s+before\b/i,
    mins: (m) => parseInt(m[1]) * 60 * 24,
    display: (m) => `Remind ${m[1]}d before`,
  },
  { regex: /\bremind\s+me\b/i,          mins: 30,  display: "Remind 30m before" },
  { regex: /\b10\s*min(?:utes?)?\s+before\b/i, mins: 10, display: "Remind 10m before" },
  { regex: /\b1\s*hour\s+before\b/i,    mins: 60,  display: "Remind 1h before" },
  { regex: /\b1\s*day\s+before\b/i,     mins: 1440, display: "Remind 1d before" },
];

// ── Date display ──────────────────────────────────────────────────────────────
export function formatDateDisplay(date: Date): string {
  const now = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const d        = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  const timeStr = hasTime
    ? ` ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
    : "";

  if (d.getTime() === today.getTime())    return `Today${timeStr}`;
  if (d.getTime() === tomorrow.getTime()) return `Tomorrow${timeStr}`;
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + timeStr;
}

// ── Local ISO ─────────────────────────────────────────────────────────────────
function toLocalISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ── Main parser ───────────────────────────────────────────────────────────────
export function parseTask(input: string): ParsedTask {
  const tokens: ParsedToken[] = [];
  let working = input;

  // 1. Recurring
  let recurring: string | null = null;
  for (const { regex, label } of RECURRING_PATTERNS) {
    const match = working.match(regex);
    if (match) {
      recurring = typeof label === "function" ? label(match) : label;
      tokens.push({ type: "recurring", raw: match[0], display: recurring });
      working = working.replace(match[0], " ").trim();
      break;
    }
  }

  // 2. Reminder
  let reminder_offset_min: number | null = null;
  for (const { regex, mins, display } of REMINDER_PATTERNS) {
    const match = working.match(regex);
    if (match) {
      reminder_offset_min = typeof mins === "function" ? mins(match) : mins;
      const disp = typeof display === "function" ? display(match) : display;
      tokens.push({ type: "reminder", raw: match[0], display: disp });
      working = working.replace(match[0], " ").trim();
      break;
    }
  }

  // 3. Labels
  const labels: string[] = [];
  for (const m of [...working.matchAll(LABEL_REGEX)]) {
    labels.push(m[1].toLowerCase());
    tokens.push({ type: "label", raw: m[0], display: `#${m[1]}` });
    working = working.replace(m[0], " ").trim();
  }

  // 4. Priority
  let priority: ParsedTask["priority"] = "medium";
  const pm = working.match(PRIORITY_REGEX);
  if (pm) {
    priority = PRIORITY_MAP[pm[0].toLowerCase()] ?? "medium";
    const displayMap: Record<ParsedTask["priority"], string> = { high: "P1", medium: "P2", low: "P3", urgent: "P4" };
    tokens.push({ type: "priority", raw: pm[0], display: displayMap[priority] });
    working = working.replace(pm[0], " ").trim();
  }

  // 5. Date/time — inject "pm" for bare ambiguous hours 1–6 before chrono
  let due_date: string | null = null;
  const bareHourRe = /(?:^|\s)(1[0-2]|[1-9])(?::([0-5]\d))?(?!\s*[ap]m)(?=\s|$)/i;
  const bareMatch  = working.match(bareHourRe);
  let chronoInput  = working;
  if (bareMatch && parseInt(bareMatch[1]) >= 1 && parseInt(bareMatch[1]) <= 6) {
    chronoInput = working.replace(bareMatch[0], bareMatch[0].trimEnd() + " pm");
  }

  const parsed = chrono.parse(chronoInput, new Date(), { forwardDate: true });
  if (parsed.length > 0) {
    const result = parsed[0];
    let date = result.date();
    // Safety net: still in past → push to tomorrow
    if (date.getTime() < Date.now()) date = new Date(date.getTime() + 86_400_000);
    due_date = toLocalISO(date);
    tokens.push({
      type: result.start.isCertain("hour") ? "time" : "date",
      raw: result.text,
      display: formatDateDisplay(date),
    });
    working = working.replace(result.text, " ").replace(/\s+/g, " ").trim();
  }

  // 6. Clean title
  const title = working.replace(/\s{2,}/g, " ").replace(/^[\s,.-]+|[\s,.-]+$/g, "").trim();

  return { title, due_date, priority, labels, recurring, reminder_offset_min, tokens };
}

// ── Compute reminder_at from due_date + offset ────────────────────────────────
export function computeReminderAt(due_date: string | null, offset_min: number | null): string | null {
  if (!due_date || offset_min === null) return null;
  const due = new Date(due_date);
  const reminderMs = due.getTime() - offset_min * 60_000;
  if (reminderMs <= Date.now()) return null; // already past
  return toLocalISO(new Date(reminderMs));
}

// ── Segments for highlighting ─────────────────────────────────────────────────
export interface Segment { text: string; token?: ParsedToken; }

export function getSegments(input: string, tokens: ParsedToken[]): Segment[] {
  if (!tokens.length) return [{ text: input }];
  const segments: Segment[] = [];
  let remaining = input;
  const sorted = [...tokens].sort((a, b) =>
    input.toLowerCase().indexOf(a.raw.toLowerCase()) - input.toLowerCase().indexOf(b.raw.toLowerCase())
  );
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
