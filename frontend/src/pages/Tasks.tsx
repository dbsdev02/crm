import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useLabels } from "@/contexts/LabelsContext";
import { useCustomers } from "@/contexts/CustomersContext";
import { TaskItem } from "@/components/task/TaskItem";
import { SectionBlock } from "@/components/task/SectionBlock";
import { TaskSheet } from "@/components/task/TaskSheet";
import { TaskDetailModal } from "@/components/task/TaskDetailModal";

const todayStr = () => new Date().toISOString().split("T")[0];

function groupByDate(tasks: any[]) {
  const groups: Record<string, any[]> = {};
  for (const t of tasks) {
    const d = t.deadline ? t.deadline.slice(0, 10) : "no-date";
    if (!groups[d]) groups[d] = [];
    groups[d].push(t);
  }
  return groups;
}

function formatDateHeader(d: string) {
  if (d === "no-date") return "No date";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

type View = "inbox" | "today" | "upcoming" | "project";

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = (searchParams.get("view") || "inbox") as View;
  const projectParam = searchParams.get("project") || null;

  const { tasks, sections, projects, users, createTask, updateTask, completeTask, deleteTask, createSection } = useTasks();
  const { labels } = useLabels();
  const { customers } = useCustomers();

  // Build unified people list for @ mentions
  const people = useMemo(() => [
    ...users.map((u: any) => ({ id: String(u.id), name: u.name, role: u.role || "staff" })),
    ...customers.map((c: any) => ({ id: String(c.id), name: c.name, role: "customer" })),
  ], [users, customers]);

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [detailTask, setDetailTask] = useState<any>(null);
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSectionFor, setAddingSectionFor] = useState<string | null>(null);

  const today = todayStr();

  // ── Filtered task sets ────────────────────────────────────────────────────
  const activeTasks = useMemo(() =>
    tasks.filter((t) => t.status !== "completed" && !t.parentTaskId),
    [tasks]
  );

  const filtered = useMemo(() => {
    let list = activeTasks;
    if (search.trim()) list = list.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [activeTasks, search]);

  const overdue   = filtered.filter((t) => t.deadline && t.deadline.slice(0, 10) < today);
  const dueToday  = filtered.filter((t) => t.deadline && t.deadline.slice(0, 10) === today);
  const upcoming  = filtered.filter((t) => t.deadline && t.deadline.slice(0, 10) > today);
  const noDate    = filtered.filter((t) => !t.deadline);
  const completed = tasks.filter((t) => t.status === "completed" && !t.parentTaskId);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openAdd = (projectId?: string | null, sectionId?: string | null, parentId?: string | null) => {
    setEditTask(null);
    setDefaultProjectId(projectId ?? null);
    setDefaultSectionId(sectionId ?? null);
    setDefaultParentId(parentId ?? null);
    setSheetOpen(true);
  };

  const handleSave = (data: any) => {
    createTask.mutate(data);
  };

  const handleUpdate = (id: string, data: any) => {
    updateTask.mutate({ id, data });
  };

  const handleComplete = (id: string) => completeTask.mutate(id);
  const handleDelete   = (id: string) => { deleteTask.mutate(id); setDetailTask(null); };

  const handleAddSubtask = (parentId: string, data: any) => {
    createTask.mutate({ ...data, parent_task_id: parentId });
  };

  const handleAddSection = (projectId: string) => {
    if (!newSectionName.trim()) return;
    createSection.mutate({ project_id: projectId, name: newSectionName.trim() });
    setNewSectionName("");
    setAddingSectionFor(null);
  };

  // ── View title ────────────────────────────────────────────────────────────
  const currentProject = projects.find((p: any) => String(p.id) === projectParam);
  const viewTitle = viewParam === "inbox" ? "Inbox"
    : viewParam === "today" ? "Today"
    : viewParam === "upcoming" ? "Upcoming"
    : currentProject?.name || "Project";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#f7f7f7] min-h-0">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 bg-[#f7f7f7] sticky top-0 z-10">
        <h1 className="text-[20px] font-bold text-[#202020]">{viewTitle}</h1>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#aaa]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-7 pr-6 py-1.5 text-[13px] bg-white border border-[#e5e5e5] rounded-xl outline-none focus:border-[#db4035] w-36 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-2 text-[#aaa]">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 pb-24">

        {/* ── INBOX view ── */}
        {viewParam === "inbox" && (
          <div className="max-w-2xl mx-auto py-2 space-y-1">
            <SectionBlock title="Overdue" tasks={overdue} allTasks={tasks} onComplete={handleComplete} onDelete={handleDelete} onTaskClick={setDetailTask} accent="text-red-500" defaultOpen />
            <SectionBlock title="Today" tasks={dueToday} allTasks={tasks} onComplete={handleComplete} onDelete={handleDelete} onTaskClick={setDetailTask} onAddTask={() => openAdd()} defaultOpen />
            <SectionBlock title="No date" tasks={noDate} allTasks={tasks} onComplete={handleComplete} onDelete={handleDelete} onTaskClick={setDetailTask} onAddTask={() => openAdd()} defaultOpen={false} />
            <SectionBlock title="Completed" tasks={completed} allTasks={tasks} onComplete={handleComplete} onDelete={handleDelete} onTaskClick={setDetailTask} defaultOpen={false} />
          </div>
        )}

        {/* ── TODAY view ── */}
        {viewParam === "today" && (
          <div className="max-w-2xl mx-auto py-2 space-y-1">
            <SectionBlock title="Overdue" tasks={overdue} allTasks={tasks} onComplete={handleComplete} onDelete={handleDelete} onTaskClick={setDetailTask} accent="text-red-500" defaultOpen />
            <SectionBlock title="Today" tasks={dueToday} allTasks={tasks} onComplete={handleComplete} onDelete={handleDelete} onTaskClick={setDetailTask} onAddTask={() => openAdd()} defaultOpen />
            <SectionBlock title="Completed" tasks={completed.filter((t) => t.deadline?.slice(0, 10) === today)} allTasks={tasks} onComplete={handleComplete} onDelete={handleDelete} onTaskClick={setDetailTask} defaultOpen={false} />
          </div>
        )}

        {/* ── UPCOMING view ── */}
        {viewParam === "upcoming" && (
          <div className="max-w-2xl mx-auto py-2">
            {Object.entries(groupByDate(upcoming))
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dateTasks]) => (
                <div key={date} className="mb-4">
                  <div className="sticky top-0 bg-[#f7f7f7] z-[5] py-1.5 px-3">
                    <p className="text-[12px] font-semibold text-[#777] uppercase tracking-wide">
                      {formatDateHeader(date)}
                    </p>
                    <div className="h-px bg-[#e5e5e5] mt-1" />
                  </div>
                  {dateTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      subtasks={tasks.filter((t) => t.parentTaskId === task.id)}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                      onClick={setDetailTask}
                    />
                  ))}
                </div>
              ))}
            {upcoming.length === 0 && (
              <div className="text-center py-16 text-[#aaa] text-[14px]">No upcoming tasks</div>
            )}
          </div>
        )}

        {/* ── PROJECT view ── */}
        {viewParam === "project" && currentProject && (() => {
          const projectId = String(currentProject.id);
          const projectSections = sections
            .filter((s: any) => String(s.project_id) === projectId)
            .sort((a: any, b: any) => a.order_index - b.order_index);
          const projectTasks = tasks.filter((t) => t.projectId === projectId);
          const unsectioned = projectTasks.filter((t) => !t.sectionId && !t.parentTaskId);

          return (
            <div className="max-w-2xl mx-auto py-2">
              {/* Unsectioned tasks */}
              {unsectioned.length > 0 && (
                <div className="mb-2">
                  {unsectioned.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      subtasks={tasks.filter((t) => t.parentTaskId === task.id)}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                      onClick={setDetailTask}
                    />
                  ))}
                </div>
              )}

              {/* Sections */}
              {projectSections.map((section: any) => {
                const sectionTasks = projectTasks.filter((t) => t.sectionId === String(section.id));
                return (
                  <SectionBlock
                    key={section.id}
                    title={section.name}
                    tasks={sectionTasks}
                    allTasks={tasks}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onTaskClick={setDetailTask}
                    onAddTask={() => openAdd(projectId, String(section.id))}
                    defaultOpen
                  />
                );
              })}

              {/* Add task (no section) */}
              <button
                onClick={() => openAdd(projectId)}
                className="flex items-center gap-2 px-3 py-2 w-full text-[13px] text-[#aaa] hover:text-[#555] hover:bg-[#f0f0f0] rounded-lg transition-colors mt-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add task
              </button>

              {/* Add section */}
              {addingSectionFor === projectId ? (
                <div className="flex items-center gap-2 mt-3 px-3">
                  <input
                    autoFocus
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSection(projectId);
                      if (e.key === "Escape") { setNewSectionName(""); setAddingSectionFor(null); }
                    }}
                    placeholder="Section name…"
                    className="flex-1 text-[13px] border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#db4035]"
                  />
                  <button onClick={() => handleAddSection(projectId)} className="text-[12px] px-3 py-1.5 bg-[#db4035] text-white rounded-lg hover:bg-[#c0392b]">Add</button>
                  <button onClick={() => { setNewSectionName(""); setAddingSectionFor(null); }} className="text-[#aaa]"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingSectionFor(projectId)}
                  className="flex items-center gap-2 px-3 py-2 w-full text-[13px] text-[#aaa] hover:text-[#555] hover:bg-[#f0f0f0] rounded-lg transition-colors mt-1 border border-dashed border-[#e0e0e0]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add section
                </button>
              )}
            </div>
          );
        })()}
      </div>

      {/* FAB */}
      <button
        onClick={() => openAdd(projectParam)}
        className="fixed bottom-20 right-4 z-40 md:bottom-6 h-12 w-12 rounded-full bg-[#db4035] text-white shadow-lg flex items-center justify-center hover:bg-[#c0392b] transition-colors active:scale-95"
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Add/Edit sheet */}
      <TaskSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSave}
        projects={projects}
        sections={sections}
        labels={labels}
        people={people}
        defaultProjectId={defaultProjectId}
        defaultSectionId={defaultSectionId}
        defaultParentId={defaultParentId}
        editTask={editTask}
      />

      {/* Task detail modal */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          projects={projects}
          sections={sections}
          users={users}
          labels={labels}
          people={people}
          allTasks={tasks}
          onClose={() => setDetailTask(null)}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onComplete={handleComplete}
          onAddSubtask={handleAddSubtask}
        />
      )}
    </div>
  );
}
