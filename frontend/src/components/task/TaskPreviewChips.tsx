import { cn } from "@/lib/utils";
import { Calendar, Flag, Tag, RefreshCw, X } from "lucide-react";
import type { ParsedTask } from "@/lib/TaskParser";

const PRIORITY_STYLE: Record<string, string> = {
  high:   "bg-red-50   text-red-500   border-red-200",
  medium: "bg-orange-50 text-orange-500 border-orange-200",
  low:    "bg-blue-50  text-blue-500  border-blue-200",
  urgent: "bg-gray-50  text-gray-400  border-gray-200",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "P1 · High", medium: "P2 · Medium", low: "P3 · Low", urgent: "P4",
};

interface TaskPreviewChipsProps {
  parsed: ParsedTask;
  onClearDate?: () => void;
  onClearPriority?: () => void;
  onClearLabel?: (l: string) => void;
  onClearRecurring?: () => void;
}

export function TaskPreviewChips({
  parsed, onClearDate, onClearPriority, onClearLabel, onClearRecurring,
}: TaskPreviewChipsProps) {
  const hasChips = parsed.due_date || parsed.priority !== "medium" ||
    parsed.labels.length > 0 || parsed.recurring;

  if (!hasChips) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-1 py-1">

      {/* Date chip */}
      {parsed.due_date && (
        <Chip
          icon={<Calendar className="h-3 w-3" />}
          label={formatDate(parsed.due_date)}
          className="bg-green-50 text-green-700 border-green-200"
          onClear={onClearDate}
        />
      )}

      {/* Recurring chip */}
      {parsed.recurring && (
        <Chip
          icon={<RefreshCw className="h-3 w-3" />}
          label={parsed.recurring}
          className="bg-purple-50 text-purple-600 border-purple-200"
          onClear={onClearRecurring}
        />
      )}

      {/* Priority chip — only show if not default */}
      {parsed.priority !== "medium" && (
        <Chip
          icon={<Flag className="h-3 w-3" />}
          label={PRIORITY_LABEL[parsed.priority]}
          className={PRIORITY_STYLE[parsed.priority]}
          onClear={onClearPriority}
        />
      )}

      {/* Label chips */}
      {parsed.labels.map((l) => (
        <Chip
          key={l}
          icon={<Tag className="h-3 w-3" />}
          label={l}
          className="bg-[#f0f0f0] text-[#555] border-[#e0e0e0]"
          onClear={() => onClearLabel?.(l)}
        />
      ))}
    </div>
  );
}

function Chip({ icon, label, className, onClear }: {
  icon: React.ReactNode;
  label: string;
  className: string;
  onClear?: () => void;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
      "transition-all duration-150",
      className
    )}>
      {icon}
      {label}
      {onClear && (
        <button
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const hasTime = iso.includes("T") && (date.getHours() !== 0 || date.getMinutes() !== 0);
  const timeStr = hasTime
    ? ` ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
    : "";

  if (d.getTime() === today.getTime()) return `Today${timeStr}`;
  if (d.getTime() === tomorrow.getTime()) return `Tomorrow${timeStr}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + timeStr;
}
