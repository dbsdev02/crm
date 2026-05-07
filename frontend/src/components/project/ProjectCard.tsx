import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
  planning: "Planning",
};

const STATUS_COLOR: Record<string, string> = {
  active:    "text-green-600 bg-green-50",
  on_hold:   "text-orange-500 bg-orange-50",
  completed: "text-blue-500 bg-blue-50",
  cancelled: "text-gray-400 bg-gray-50",
  planning:  "text-purple-500 bg-purple-50",
};

interface ProjectCardProps {
  project: any;
  taskCount: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, taskCount, onClick, onEdit, onDelete }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f5f5f5] cursor-pointer transition-colors relative"
      onClick={onClick}
    >
      {/* Color dot */}
      <div
        className="h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: project.color || "#4073ff" }}
      />

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[#202020] truncate">{project.name}</p>
        {project.description && (
          <p className="text-[12px] text-[#aaa] truncate">{project.description}</p>
        )}
      </div>

      {/* Task count */}
      <span className="text-[12px] text-[#aaa] shrink-0">{taskCount > 0 ? taskCount : ""}</span>

      {/* Status badge */}
      <span className={cn(
        "text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 hidden sm:block",
        STATUS_COLOR[project.status] || STATUS_COLOR.active
      )}>
        {STATUS_LABEL[project.status] || project.status}
      </span>

      {/* Context menu */}
      <div className="relative shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-1 rounded-lg hover:bg-[#e5e5e5] text-[#aaa] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-7 z-20 bg-white border border-[#e5e5e5] rounded-xl shadow-lg py-1 w-36">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#202020] hover:bg-[#f5f5f5]"
              >
                <Pencil className="h-3.5 w-3.5 text-[#777]" /> Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
