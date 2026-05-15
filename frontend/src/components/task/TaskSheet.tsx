import { useState, useEffect, useRef, useCallback } from "react";
import { X, Calendar, Flag, Tag, FolderOpen, AlignLeft, Sparkles, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { parseTask, type ParsedTask } from "@/lib/TaskParser";
import { TaskPreviewChips } from "./TaskPreviewChips";
import { useMention, type MentionPerson } from "@/hooks/useMention";
import { MentionDropdown } from "@/components/MentionDropdown";
import MentionTextarea from "@/components/MentionTextarea";

const PRIORITIES = [
  { value: "high",   label: "P1 — High",   color: "text-red-500" },
  { value: "medium", label: "P2 — Medium", color: "text-orange-400" },
  { value: "low",    label: "P3 — Low",    color: "text-blue-400" },
  { value: "urgent", label: "P4 — None",   color: "text-gray-400" },
];

interface TaskSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: any) => void;
  projects: any[];
  sections: any[];
  labels: string[];
  people?: MentionPerson[];        // staff + customers combined
  defaultProjectId?: string | null;
  defaultSectionId?: string | null;
  defaultParentId?: string | null;
  editTask?: any;
}

const emptyForm = () => ({
  rawInput: "",
  description: "",
  deadline: "",
  priority: "medium" as ParsedTask["priority"],
  projectId: "none",
  sectionId: "none",
  labels: [] as string[],
  recurring: null as string | null,
  reminder_offset_min: null as number | null,
});

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function TaskSheet({
  open, onOpenChange, onSave, projects, sections, labels, people = [],
  defaultProjectId, defaultSectionId, defaultParentId, editTask,
}: TaskSheetProps) {
  const [form, setForm] = useState(emptyForm());
  const [parsed, setParsed] = useState<ParsedTask | null>(null);
  const [smartMode, setSmartMode] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mention in title input
  const titleMention = useMention({ people });

  const debouncedInput = useDebounce(form.rawInput, 120);

  // Reset on open
  useEffect(() => {
    if (editTask) {
      setForm({
        rawInput: editTask.title || "",
        description: editTask.description || "",
        deadline: editTask.deadline || "",
        priority: editTask.priority || "medium",
        projectId: editTask.projectId || "none",
        sectionId: editTask.sectionId || "none",
        labels: editTask.labels || [],
        recurring: null,
      });
      setParsed(null);
    } else {
      setForm({
        ...emptyForm(),
        projectId: defaultProjectId || "none",
        sectionId: defaultSectionId || "none",
      });
      setParsed(null);
    }
  }, [open, editTask, defaultProjectId, defaultSectionId]);

  // Live parse on debounced input
  useEffect(() => {
    if (!smartMode || !debouncedInput.trim()) {
      setParsed(null);
      setForm((f) => ({ ...f, deadline: "", priority: "medium", labels: [], recurring: null, reminder_offset_min: null }));
      return;
    }
    const result = parseTask(debouncedInput);
    setParsed(result);
    setForm((f) => ({
      ...f,
      deadline: result.due_date ?? "",
      priority: result.priority,
      labels: result.labels.length > 0 ? result.labels : f.labels,
      recurring: result.recurring,
      reminder_offset_min: result.reminder_offset_min,
    }));
  }, [debouncedInput, smartMode]);

  const projectSections = sections.filter(
    (s) => form.projectId !== "none" && String(s.project_id) === form.projectId
  );

  // Final title = parsed clean title or raw input
  const finalTitle = parsed?.title || form.rawInput;

  const handleSave = () => {
    if (!finalTitle.trim()) return;

    // Extract @mentioned staff user IDs from title + description
    const combinedText = `${form.rawInput} ${form.description}`;
    const assignees = people
      .filter((p) => p.role !== "customer" && combinedText.includes(`@${p.name}`))
      .map((p) => Number(p.id))
      .filter((id, i, arr) => arr.indexOf(id) === i); // dedupe

    const reminder_at = form.deadline && form.reminder_offset_min
      ? new Date(new Date(form.deadline).getTime() - form.reminder_offset_min * 60000).toISOString()
      : null;

    onSave({
      title: finalTitle.trim(),
      description: form.description.trim(),
      due_date: form.deadline || null,
      priority: form.priority,
      project_id: form.projectId === "none" ? null : form.projectId,
      section_id: form.sectionId === "none" ? null : form.sectionId,
      parent_task_id: defaultParentId || null,
      labels: form.labels,
      recurring_rule: form.recurring || null,
      reminder_at,
      assignees,
      assigned_to: assignees[0] ?? null,
      status: "pending",
    });
    onOpenChange(false);
  };

  const toggleLabel = (l: string) =>
    setForm((f) => ({
      ...f,
      labels: f.labels.includes(l) ? f.labels.filter((x) => x !== l) : [...f.labels, l],
    }));

  // Chip clear handlers — remove token from raw input and reset field
  const clearDate = () => {
    if (parsed) {
      const dateToken = parsed.tokens.find((t) => t.type === "date" || t.type === "time");
      if (dateToken) setForm((f) => ({ ...f, rawInput: f.rawInput.replace(dateToken.raw, "").trim(), deadline: "" }));
    } else {
      setForm((f) => ({ ...f, deadline: "" }));
    }
  };

  const clearPriority = () => {
    if (parsed) {
      const pt = parsed.tokens.find((t) => t.type === "priority");
      if (pt) setForm((f) => ({ ...f, rawInput: f.rawInput.replace(pt.raw, "").trim(), priority: "medium" }));
    } else {
      setForm((f) => ({ ...f, priority: "medium" }));
    }
  };

  const clearLabel = (l: string) => {
    setForm((f) => ({
      ...f,
      rawInput: f.rawInput.replace(`#${l}`, "").trim(),
      labels: f.labels.filter((x) => x !== l),
    }));
  };

  const clearReminder = () => {
    if (parsed) {
      const rt = parsed.tokens.find((t) => t.type === "reminder");
      if (rt) setForm((f) => ({ ...f, rawInput: f.rawInput.replace(rt.raw, "").trim(), reminder_offset_min: null }));
    } else {
      setForm((f) => ({ ...f, reminder_offset_min: null }));
    }
  };

  const clearRecurring = () => {
    if (parsed) {
      const rt = parsed.tokens.find((t) => t.type === "recurring");
      if (rt) setForm((f) => ({ ...f, rawInput: f.rawInput.replace(rt.raw, "").trim(), recurring: null }));
    }
  };

  const flagColor = {
    high: "text-red-500", medium: "text-orange-400",
    low: "text-blue-400", urgent: "text-gray-400",
  }[form.priority];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 max-h-[92vh] overflow-y-auto border-0 shadow-2xl bg-white"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[#e0e0e0]" />
        </div>

        <div className="px-4 pb-6 space-y-2">

          {/* Smart input row with @ mention */}
          <div className="relative flex items-center gap-2">
            <input
              ref={inputRef}
              autoFocus
              placeholder={smartMode
                ? "e.g. Meet client tomorrow 7pm #sales p1 @john"
                : "Task name — type @ to mention someone"}
              value={form.rawInput}
              onChange={(e) => {
                setForm({ ...form, rawInput: e.target.value });
                titleMention.onInputChange(e.target.value, e.target.selectionStart ?? 0);
              }}
              onKeyDown={(e) => {
                const handled = titleMention.handleKeyDown(
                  e, form.rawInput, inputRef.current?.selectionStart ?? 0,
                  ({ newValue, newCursor }) => {
                    setForm((f) => ({ ...f, rawInput: newValue }));
                    setTimeout(() => {
                      inputRef.current?.focus();
                      inputRef.current?.setSelectionRange(newCursor, newCursor);
                    }, 0);
                  }
                );
                if (!handled && e.key === "Enter" && !titleMention.isOpen) handleSave();
              }}
              onBlur={() => setTimeout(titleMention.close, 150)}
              className="flex-1 text-[15px] font-medium text-[#202020] bg-transparent border-none outline-none placeholder:text-[#ccc] pt-1"
            />
            {/* Smart mode toggle */}
            <button
              onClick={() => setSmartMode(!smartMode)}
              title={smartMode ? "Smart parsing ON" : "Smart parsing OFF"}
              className={cn(
                "shrink-0 p-1.5 rounded-lg transition-colors",
                smartMode ? "text-[#db4035] bg-red-50" : "text-[#bbb] hover:bg-[#f5f5f5]"
              )}
            >
              <Sparkles className="h-4 w-4" />
            </button>
            {/* Mention dropdown for title */}
            {titleMention.isOpen && (
              <div className="absolute top-full left-0 w-full z-50">
                <MentionDropdown
                  people={titleMention.filtered}
                  activeIndex={titleMention.activeIndex}
                  onMouseEnter={titleMention.setActiveIndex}
                  query=""
                  onSelect={(person) => {
                    const cursor = inputRef.current?.selectionStart ?? form.rawInput.length;
                    const { newValue, newCursor } = titleMention.insertMention(form.rawInput, person, cursor);
                    setForm((f) => ({ ...f, rawInput: newValue }));
                    setTimeout(() => {
                      inputRef.current?.focus();
                      inputRef.current?.setSelectionRange(newCursor, newCursor);
                    }, 0);
                  }}
                />
              </div>
            )}
          </div>

          {smartMode && parsed && (
            <TaskPreviewChips
              parsed={{ ...parsed, labels: form.labels, priority: form.priority, due_date: form.deadline, recurring: form.recurring, reminder_offset_min: form.reminder_offset_min }}
              onClearDate={clearDate}
              onClearPriority={clearPriority}
              onClearLabel={clearLabel}
              onClearRecurring={clearRecurring}
              onClearReminder={clearReminder}
            />
          )}

          {/* Smart hint */}
          {smartMode && !form.rawInput && (
            <p className="text-[11px] text-[#ccc] px-1">
              Type naturally — dates, #labels, p1–p4, @name detected automatically
            </p>
          )}

          {/* Description with @ mention */}
          <div className="flex gap-2 items-start pt-1">
            <AlignLeft className="h-4 w-4 text-[#ccc] mt-2 shrink-0" />
            <MentionTextarea
              placeholder="Description — type @ to mention someone"
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
              people={people}
              rows={2}
              className="border-none focus:border-none px-0 py-1 text-[13px]"
            />
          </div>

          <div className="h-px bg-[#f5f5f5]" />

          {/* Manual overrides toolbar */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Due date */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e5e5e5] text-[12px] text-[#555] hover:bg-[#f5f5f5] transition-colors">
              <Calendar className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="bg-transparent border-none outline-none text-[12px] text-[#555] w-[130px] cursor-pointer"
              />
            </div>

            {/* Priority */}
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as any })}>
              <SelectTrigger className="h-8 w-auto px-2.5 border-[#e5e5e5] text-[12px] gap-1.5 rounded-lg">
                <Flag className={cn("h-3.5 w-3.5 shrink-0", flagColor)} />
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

            {/* Project */}
            <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v, sectionId: "none" })}>
              <SelectTrigger className="h-8 w-auto px-2.5 border-[#e5e5e5] text-[12px] gap-1.5 rounded-lg">
                <FolderOpen className="h-3.5 w-3.5 text-[#aaa] shrink-0" />
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Section */}
            {projectSections.length > 0 && (
              <Select value={form.sectionId} onValueChange={(v) => setForm({ ...form, sectionId: v })}>
                <SelectTrigger className="h-8 w-auto px-2.5 border-[#e5e5e5] text-[12px] gap-1.5 rounded-lg">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No section</SelectItem>
                  {projectSections.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Labels */}
          {labels.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="h-3.5 w-3.5 text-[#ccc] shrink-0" />
              {labels.map((l) => (
                <button
                  key={l}
                  onClick={() => toggleLabel(l)}
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full border transition-all",
                    form.labels.includes(l)
                      ? "bg-[#202020] text-white border-[#202020]"
                      : "border-[#e5e5e5] text-[#777] hover:border-[#aaa]"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          )}

          <div className="h-px bg-[#f5f5f5]" />

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg hover:bg-[#f0f0f0] text-[#bbb] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <Button
              onClick={handleSave}
              disabled={!finalTitle.trim()}
              className="h-9 px-5 rounded-xl bg-[#db4035] hover:bg-[#c0392b] text-white text-[13px] font-medium"
            >
              {editTask ? "Save changes" : "Add task"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
