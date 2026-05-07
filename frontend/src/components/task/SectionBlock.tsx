import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskItem } from "./TaskItem";

interface SectionBlockProps {
  title: string;
  tasks: any[];
  allTasks: any[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onTaskClick: (task: any) => void;
  onAddTask?: () => void;
  defaultOpen?: boolean;
  accent?: string;
}

export function SectionBlock({
  title, tasks, allTasks, onComplete, onDelete, onTaskClick,
  onAddTask, defaultOpen = true, accent,
}: SectionBlockProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (tasks.length === 0 && !onAddTask) return null;

  const rootTasks = tasks.filter((t) => !t.parentTaskId);
  const activeCount = tasks.filter((t) => t.status !== "completed").length;

  return (
    <div className="mb-1">
      {/* Header row — div not button, avoids nested button violation */}
      <div className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors">
        {/* Toggle area */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => e.key === "Enter" && setOpen(!open)}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
        >
          <ChevronDown className={cn(
            "h-3.5 w-3.5 text-[#aaa] transition-transform duration-200 shrink-0",
            !open && "-rotate-90"
          )} />
          <span className={cn("text-[12px] font-semibold uppercase tracking-wide", accent || "text-[#777]")}>
            {title}
          </span>
          {activeCount > 0 && (
            <span className="text-[11px] text-[#aaa]">{activeCount}</span>
          )}
        </div>

        {/* Add button — sibling, not child of another button */}
        {onAddTask && (
          <button
            type="button"
            onClick={onAddTask}
            className="shrink-0 p-1 rounded hover:bg-[#e5e5e5] text-[#aaa] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Task list */}
      {open && (
        <div className="mt-0.5">
          {rootTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              subtasks={allTasks.filter((t) => t.parentTaskId === task.id)}
              onComplete={onComplete}
              onDelete={onDelete}
              onClick={onTaskClick}
            />
          ))}
          {onAddTask && (
            <button
              type="button"
              onClick={onAddTask}
              className="flex items-center gap-2 px-3 py-2 w-full text-[13px] text-[#aaa] hover:text-[#555] hover:bg-[#f5f5f5] rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add task
            </button>
          )}
        </div>
      )}
    </div>
  );
}
