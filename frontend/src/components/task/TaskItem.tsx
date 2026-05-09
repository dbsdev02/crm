import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight, Flag, Calendar, Tag, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-500", medium: "text-orange-400", low: "text-blue-400", urgent: "text-gray-400",
};
const PRIORITY_LABEL: Record<string, string> = {
  high: "P1", medium: "P2", low: "P3", urgent: "P4",
};

const todayStr = () => new Date().toISOString().split("T")[0];

function formatDeadline(deadline: string) {
  if (!deadline) return null;
  const d = deadline.slice(0, 10);
  const today = todayStr();
  const tom = new Date(); tom.setDate(tom.getDate() + 1);
  const tomStr = tom.toISOString().split("T")[0];
  if (d < today) return { label: "Overdue", color: "text-red-500" };
  if (d === today) return { label: "Today", color: "text-green-600" };
  if (d === tomStr) return { label: "Tomorrow", color: "text-orange-500" };
  return {
    label: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    color: "text-[#777]",
  };
}

interface TaskItemProps {
  task: any;
  subtasks?: any[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (task: any) => void;
  depth?: number;
}

export function TaskItem({ task, subtasks = [], onComplete, onDelete, onClick, depth = 0 }: TaskItemProps) {
  const [completing, setCompleting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const qc = useQueryClient();

  const completed  = task.status === "completed";
  const isOverdue  = !completed && (task.status === "overdue" || (task.deadline && task.deadline.slice(0, 10) < todayStr()));
  const deadline   = formatDeadline(task.deadline);
  const hasSubtasks = subtasks.length > 0;

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (completed) return;
    setCompleting(true);
    setTimeout(() => { onComplete(task.id); setCompleting(false); }, 250);
  };

  const rescheduleToTomorrow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRescheduling(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const due = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T09:00`;
    try {
      await api.put(`/tasks/${task.id}`, {
        ...task,
        due_date: due,
        status: "pending",
        assigned_to: task.assignedTo,
        project_id: task.projectId,
        labels: task.labels,
      });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <div className={cn("group", depth > 0 && "ml-5 pl-3 border-l border-[#e5e5e5]")}>

      {/* Main row */}
      <div
        className={cn(
          "flex items-start gap-3 px-3 py-2 cursor-pointer rounded-lg",
          "hover:bg-[#f5f5f5] transition-colors duration-100",
          completing && "opacity-30 transition-opacity duration-300",
          completed && "opacity-50"
        )}
        onClick={() => onClick(task)}
      >
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          className={cn(
            "mt-0.5 shrink-0 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center transition-all duration-200",
            completed
              ? "border-green-500 bg-green-500"
              : cn("hover:opacity-70", PRIORITY_COLOR[task.priority] || "border-[#ccc]"),
            !completed && "border-current"
          )}
        >
          {completed && <CheckCircle2 className="h-3 w-3 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-[14px] leading-snug text-[#202020]", completed && "line-through text-[#aaa]")}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {deadline && (
              <span className={cn("flex items-center gap-0.5 text-[11px] font-medium", deadline.color)}>
                <Calendar className="h-3 w-3" />{deadline.label}
              </span>
            )}
            {task.priority && task.priority !== "medium" && (
              <span className={cn("flex items-center gap-0.5 text-[11px] font-medium", PRIORITY_COLOR[task.priority])}>
                <Flag className="h-3 w-3" />{PRIORITY_LABEL[task.priority]}
              </span>
            )}
            {task.labels?.slice(0, 2).map((l: string) => (
              <span key={l} className="flex items-center gap-0.5 text-[11px] text-[#777]">
                <Tag className="h-2.5 w-2.5" />{l}
              </span>
            ))}
            {hasSubtasks && (
              <span className="text-[11px] text-[#777]">
                {subtasks.filter((s) => s.status === "completed").length}/{subtasks.length} subtasks
              </span>
            )}
            {task.projectName && depth === 0 && (
              <span className="text-[11px] text-[#777] truncate max-w-[100px]">{task.projectName}</span>
            )}
            {/* Assignee avatars */}
            {task.assignees?.length > 0 && (
              <div className="flex -space-x-1">
                {task.assignees.slice(0, 3).map((a: any) => (
                  <div
                    key={a.id}
                    title={a.name}
                    className="h-4 w-4 rounded-full bg-[#dbeafe] border border-white flex items-center justify-center text-[8px] font-bold text-blue-700"
                  >
                    {a.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                ))}
                {task.assignees.length > 3 && (
                  <div className="h-4 w-4 rounded-full bg-[#e0e0e0] border border-white flex items-center justify-center text-[8px] text-[#555]">
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {hasSubtasks && (
          <button
            onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
            className="shrink-0 p-1 rounded hover:bg-[#e5e5e5] text-[#aaa] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200", !collapsed && "rotate-90")} />
          </button>
        )}
      </div>

      {/* Overdue reschedule suggestion */}
      {isOverdue && (
        <div className="ml-7 mb-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-[11px] text-red-400">Overdue —</span>
          <button
            onClick={rescheduleToTomorrow}
            disabled={rescheduling}
            className="flex items-center gap-1 text-[11px] text-[#db4035] hover:underline font-medium disabled:opacity-50"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            {rescheduling ? "Moving…" : "Move to tomorrow?"}
          </button>
        </div>
      )}

      {/* Subtasks */}
      {hasSubtasks && !collapsed && (
        <div>
          {subtasks.map((sub) => (
            <TaskItem
              key={sub.id}
              task={sub}
              onComplete={onComplete}
              onDelete={onDelete}
              onClick={onClick}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

    </div>
  );
}
