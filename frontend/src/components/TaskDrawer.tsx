import { useState, useEffect } from "react";
import { X, Calendar, Flag, Tag, User, Trash2, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MentionTextarea from "@/components/MentionTextarea";

const PRIORITY_CONFIG = {
  high:   { label: "P1", color: "text-red-500",    bg: "bg-red-50",    border: "border-red-200" },
  medium: { label: "P2", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
  low:    { label: "P3", color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-200" },
  urgent: { label: "P4", color: "text-gray-400",   bg: "bg-gray-50",   border: "border-gray-200" },
};

const LABEL_COLORS: Record<string, string> = {
  bug: "bg-red-100 text-red-700", feature: "bg-blue-100 text-blue-700",
  design: "bg-purple-100 text-purple-700", urgent: "bg-orange-100 text-orange-700",
  review: "bg-yellow-100 text-yellow-700", backend: "bg-slate-100 text-slate-700",
  frontend: "bg-cyan-100 text-cyan-700",
};
const labelColor = (l: string) => LABEL_COLORS[l.toLowerCase()] ?? "bg-gray-100 text-gray-700";

interface TaskDrawerProps {
  task: any;
  projects: any[];
  users: any[];
  labels: string[];
  onClose: () => void;
  onSave: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

export function TaskDrawer({ task, projects, users, labels, onClose, onSave, onDelete, onComplete }: TaskDrawerProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [deadline, setDeadline] = useState(task.deadline || "");
  const [priority, setPriority] = useState<string>(task.priority || "medium");
  const [projectId, setProjectId] = useState<string>(task.projectId ?? "none");
  const [taskLabels, setTaskLabels] = useState<string[]>(task.labels || []);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setTitle(task.title); setDescription(task.description || "");
    setDeadline(task.deadline || ""); setPriority(task.priority || "medium");
    setProjectId(task.projectId ?? "none"); setTaskLabels(task.labels || []);
    setDirty(false);
  }, [task.id]);

  const mark = () => setDirty(true);

  const handleSave = () => {
    if (!dirty) return;
    const assignees = (description.match(/@([\w\s]+?)(?=\s@|\s*$|[.,!?])/g) ?? [])
      .map((m: string) => m.slice(1).trim())
      .flatMap((name: string) => users.filter((u: any) => u.name.toLowerCase() === name.toLowerCase()).map((u: any) => Number(u.id)));
    onSave(task.id, {
      title, description, due_date: deadline, priority,
      project_id: projectId === "none" ? null : projectId,
      labels: taskLabels, assignees, assigned_to: assignees[0] ?? null,
    });
    setDirty(false);
  };

  const pc = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium;
  const completed = task.status === "completed";

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/10" />
      {/* Drawer */}
      <div
        className="w-full max-w-md bg-white border-l border-[#e5e5e5] flex flex-col h-full shadow-xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e5e5]">
          <button
            onClick={() => onComplete(task.id)}
            disabled={completed}
            className={cn(
              "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
              completed ? "border-green-500 bg-green-500" : "border-[#808080] hover:border-green-500"
            )}
          >
            {completed && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </button>
          <div className="flex items-center gap-1 ml-auto">
            {dirty && (
              <button onClick={handleSave} className="text-xs px-3 py-1 bg-[#db4035] text-white rounded-md hover:bg-[#c0392b] transition-colors">
                Save
              </button>
            )}
            <button onClick={() => onDelete(task.id)} className="p-1.5 rounded hover:bg-[#f5f5f5] text-[#808080] hover:text-red-500 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-[#f5f5f5] text-[#808080] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); mark(); }}
            onBlur={handleSave}
            className={cn(
              "w-full text-[15px] font-medium text-[#202020] bg-transparent border-none outline-none resize-none leading-snug",
              completed && "line-through text-[#808080]"
            )}
            placeholder="Task name"
          />

          {/* Description */}
          <div className="flex gap-2.5">
            <AlignLeft className="h-4 w-4 text-[#808080] mt-1 shrink-0" />
            <MentionTextarea
              placeholder="Description, notes…"
              value={description}
              onChange={(v) => { setDescription(v); mark(); }}
              people={users.map((u: any) => ({ id: String(u.id), name: u.name, role: u.role || "staff" }))}
            />
          </div>

          {/* Due date */}
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-[#808080] shrink-0" />
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => { setDeadline(e.target.value); mark(); }}
              onBlur={handleSave}
              className="text-sm text-[#202020] bg-transparent border border-[#e5e5e5] rounded-md px-2 py-1 outline-none focus:border-[#db4035] transition-colors"
            />
          </div>

          {/* Priority */}
          <div className="flex items-center gap-2.5">
            <Flag className={cn("h-4 w-4 shrink-0", pc.color)} />
            <Select value={priority} onValueChange={(v) => { setPriority(v); mark(); setTimeout(handleSave, 0); }}>
              <SelectTrigger className={cn("h-8 w-36 text-sm border", pc.border, pc.bg, pc.color, "font-medium")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high"><span className="text-red-500 font-medium">P1</span> — High</SelectItem>
                <SelectItem value="medium"><span className="text-orange-500 font-medium">P2</span> — Medium</SelectItem>
                <SelectItem value="low"><span className="text-blue-500 font-medium">P3</span> — Low</SelectItem>
                <SelectItem value="urgent"><span className="text-gray-400 font-medium">P4</span> — No priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 text-[#808080] shrink-0" />
            <Select value={projectId} onValueChange={(v) => { setProjectId(v); mark(); setTimeout(handleSave, 0); }}>
              <SelectTrigger className="h-8 w-48 text-sm border border-[#e5e5e5]">
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Labels */}
          <div className="flex items-start gap-2.5">
            <Tag className="h-4 w-4 text-[#808080] mt-1 shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {taskLabels.map((l) => (
                <button
                  key={l}
                  onClick={() => { setTaskLabels((prev) => prev.filter((x) => x !== l)); mark(); }}
                  className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1", labelColor(l))}
                >
                  {l} <X className="h-2.5 w-2.5" />
                </button>
              ))}
              <Select value="" onValueChange={(v) => { if (v && !taskLabels.includes(v)) { setTaskLabels((p) => [...p, v]); mark(); } }}>
                <SelectTrigger className="h-6 w-24 text-xs border border-dashed border-[#c0c0c0] text-[#808080]">
                  <SelectValue placeholder="+ Label" />
                </SelectTrigger>
                <SelectContent>
                  {labels.filter((l) => !taskLabels.includes(l)).map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
