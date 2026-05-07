import { useState, useEffect } from "react";
import { X, Trash2, Calendar, Flag, FolderOpen, Tag, AlignLeft, Plus, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import MentionTextarea from "@/components/MentionTextarea";
import type { MentionPerson } from "@/hooks/useMention";

const PRIORITIES = [
  { value: "high",   label: "P1 — High",   color: "text-red-500",    bg: "bg-red-50",    border: "border-red-200" },
  { value: "medium", label: "P2 — Medium", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
  { value: "low",    label: "P3 — Low",    color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-200" },
  { value: "urgent", label: "P4 — None",   color: "text-gray-400",   bg: "bg-gray-50",   border: "border-gray-200" },
];

interface TaskDetailModalProps {
  task: any;
  projects: any[];
  sections: any[];
  users: any[];
  labels: string[];
  people: MentionPerson[];
  allTasks: any[];
  onClose: () => void;
  onSave: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onAddSubtask: (parentId: string, data: any) => void;
}

export function TaskDetailModal({
  task, projects, sections, users, labels, people, allTasks,
  onClose, onSave, onDelete, onComplete, onAddSubtask,
}: TaskDetailModalProps) {
  const qc = useQueryClient();
  const [title, setTitle]           = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [deadline, setDeadline]     = useState(task.deadline || "");
  const [priority, setPriority]     = useState(task.priority || "medium");
  const [projectId, setProjectId]   = useState(task.projectId || "none");
  const [taskLabels, setTaskLabels] = useState<string[]>(task.labels || []);
  const [dirty, setDirty]           = useState(false);
  const [comment, setComment]       = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setDeadline(task.deadline || "");
    setPriority(task.priority || "medium");
    setProjectId(task.projectId || "none");
    setTaskLabels(task.labels || []);
    setDirty(false);
  }, [task.id]);

  const { data: comments = [] } = useQuery({
    queryKey: ["task-comments", task.id],
    queryFn: () => api.get<any[]>(`/tasks/${task.id}/comments`),
  });

  const addComment = useMutation({
    mutationFn: (content: string) => api.post(`/tasks/${task.id}/comments`, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["task-comments", task.id] }); setComment(""); },
  });

  const deleteComment = useMutation({
    mutationFn: (cid: string) => api.delete(`/tasks/${task.id}/comments/${cid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-comments", task.id] }),
  });

  const mark = () => setDirty(true);

  const handleSave = () => {
    if (!dirty) return;
    onSave(task.id, {
      title, description, due_date: deadline || null, priority,
      project_id: projectId === "none" ? null : projectId,
      labels: taskLabels, status: task.status,
    });
    setDirty(false);
  };

  const subtasks  = allTasks.filter((t) => t.parentTaskId === task.id);
  const completed = task.status === "completed";
  const pc        = PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[1];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      <div
        className="relative w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] md:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] shrink-0">
          <button
            onClick={() => onComplete(task.id)}
            disabled={completed}
            className={cn(
              "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
              completed ? "border-green-500 bg-green-500" : "border-[#ccc] hover:border-green-400"
            )}
          >
            {completed && <CheckCircle2 className="h-3 w-3 text-white" />}
          </button>
          <div className="flex items-center gap-1 ml-auto">
            {dirty && (
              <button
                onClick={handleSave}
                className="text-[12px] px-3 py-1 bg-[#db4035] text-white rounded-lg hover:bg-[#c0392b] transition-colors"
              >
                Save
              </button>
            )}
            <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#aaa] hover:text-red-500 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#aaa] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Title */}
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); mark(); }}
            onBlur={handleSave}
            className={cn(
              "w-full text-[16px] font-medium text-[#202020] bg-transparent border-none outline-none",
              completed && "line-through text-[#aaa]"
            )}
            placeholder="Task name"
          />

          {/* Description — with @ mention */}
          <div className="flex gap-2.5 items-start">
            <AlignLeft className="h-4 w-4 text-[#bbb] mt-2 shrink-0" />
            <MentionTextarea
              placeholder="Description — type @ to mention someone"
              value={description}
              onChange={(v) => { setDescription(v); mark(); }}
              people={people}
              rows={2}
              className="border-none focus:border-none px-0 py-1 text-[13px]"
            />
          </div>

          <div className="h-px bg-[#f5f5f5]" />

          {/* Fields */}
          <div className="space-y-2.5">
            {/* Due date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[#bbb] shrink-0" />
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => { setDeadline(e.target.value); mark(); }}
                onBlur={handleSave}
                className="text-[13px] text-[#555] bg-transparent border border-[#e5e5e5] rounded-lg px-2.5 py-1 outline-none focus:border-[#db4035] transition-colors"
              />
            </div>

            {/* Priority */}
            <div className="flex items-center gap-3">
              <Flag className={cn("h-4 w-4 shrink-0", pc.color)} />
              <Select value={priority} onValueChange={(v) => { setPriority(v); mark(); setTimeout(handleSave, 0); }}>
                <SelectTrigger className={cn("h-8 w-36 text-[13px] border rounded-lg", pc.border, pc.bg, pc.color, "font-medium")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className={cn("font-medium", p.color)}>{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project */}
            <div className="flex items-center gap-3">
              <FolderOpen className="h-4 w-4 text-[#bbb] shrink-0" />
              <Select value={projectId} onValueChange={(v) => { setProjectId(v); mark(); setTimeout(handleSave, 0); }}>
                <SelectTrigger className="h-8 w-48 text-[13px] border border-[#e5e5e5] rounded-lg">
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Labels */}
            <div className="flex items-start gap-3">
              <Tag className="h-4 w-4 text-[#bbb] mt-1 shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setTaskLabels((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);
                      mark();
                      setTimeout(handleSave, 0);
                    }}
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded-full border transition-all",
                      taskLabels.includes(l)
                        ? "bg-[#202020] text-white border-[#202020]"
                        : "border-[#e5e5e5] text-[#777] hover:border-[#aaa]"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-[#f5f5f5]" />

          {/* Subtasks */}
          <div>
            <p className="text-[12px] font-semibold text-[#777] uppercase tracking-wide mb-2">Sub-tasks</p>
            {subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#f5f5f5]">
                <div className={cn(
                  "h-4 w-4 rounded-full border-2 shrink-0",
                  sub.status === "completed" ? "border-green-500 bg-green-500" : "border-[#ccc]"
                )} />
                <span className={cn("text-[13px] text-[#202020]", sub.status === "completed" && "line-through text-[#aaa]")}>
                  {sub.title}
                </span>
              </div>
            ))}
            {addingSubtask ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  autoFocus
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSubtask.trim()) {
                      onAddSubtask(task.id, { title: newSubtask.trim(), priority: "medium", status: "pending" });
                      setNewSubtask(""); setAddingSubtask(false);
                    }
                    if (e.key === "Escape") { setNewSubtask(""); setAddingSubtask(false); }
                  }}
                  placeholder="Sub-task name…"
                  className="flex-1 text-[13px] border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#db4035]"
                />
                <button onClick={() => setAddingSubtask(false)} className="text-[#aaa] hover:text-[#555]">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingSubtask(true)}
                className="flex items-center gap-1.5 text-[12px] text-[#aaa] hover:text-[#555] mt-1 px-2 py-1 rounded-lg hover:bg-[#f5f5f5] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add sub-task
              </button>
            )}
          </div>

          <div className="h-px bg-[#f5f5f5]" />

          {/* Comments */}
          <div>
            <p className="text-[12px] font-semibold text-[#777] uppercase tracking-wide mb-2">Comments</p>
            <div className="space-y-3">
              {(comments as any[]).map((c: any) => (
                <div key={c.id} className="flex gap-2.5 group/comment">
                  <div className="h-7 w-7 rounded-full bg-[#f0f0f0] flex items-center justify-center text-[11px] font-bold text-[#777] shrink-0">
                    {c.user_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12px] font-semibold text-[#202020]">{c.user_name}</span>
                      <span className="text-[11px] text-[#aaa]">
                        {new Date(c.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#555] mt-0.5 whitespace-pre-wrap">{c.content}</p>
                  </div>
                  <button
                    onClick={() => deleteComment.mutate(String(c.id))}
                    className="opacity-0 group-hover/comment:opacity-100 p-1 text-[#aaa] hover:text-red-500 transition-all shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Comment input — with @ mention */}
            <div className="mt-3 border border-[#e5e5e5] rounded-xl focus-within:border-[#db4035] transition-colors">
              <MentionTextarea
                placeholder="Add a comment — type @ to mention someone"
                value={comment}
                onChange={setComment}
                people={people}
                rows={1}
                className="border-none focus:border-none rounded-xl px-3 py-2 text-[13px]"
              />
              <div className="flex justify-end px-3 pb-2">
                <button
                  onClick={() => comment.trim() && addComment.mutate(comment.trim())}
                  disabled={!comment.trim()}
                  className="flex items-center gap-1.5 text-[12px] px-3 py-1 bg-[#db4035] text-white rounded-lg disabled:opacity-30 hover:bg-[#c0392b] transition-colors"
                >
                  <Send className="h-3 w-3" /> Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
