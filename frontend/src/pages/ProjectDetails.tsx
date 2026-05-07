import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MoreHorizontal, Pencil, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useLabels } from "@/contexts/LabelsContext";
import { useCustomers } from "@/contexts/CustomersContext";
import { TaskItem } from "@/components/task/TaskItem";
import { TaskSheet } from "@/components/task/TaskSheet";
import { TaskDetailModal } from "@/components/task/TaskDetailModal";
import { ProjectFormModal } from "@/components/project/ProjectFormModal";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, sections, projects, users, createTask, updateTask, completeTask, deleteTask, createSection, updateSection, deleteSection } = useTasks();
  const { updateProject, deleteProject } = useProjects();
  const { labels } = useLabels();
  const { customers } = useCustomers();

  const people = useMemo(() => [
    ...users.map((u: any) => ({ id: String(u.id), name: u.name, role: u.role || "staff" })),
    ...customers.map((c: any) => ({ id: String(c.id), name: c.name, role: "customer" })),
  ], [users, customers]);

  const project = projects.find((p: any) => String(p.id) === id);
  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId === id), [tasks, id]);
  const projectSections = useMemo(() =>
    sections.filter((s: any) => String(s.project_id) === id).sort((a: any, b: any) => a.order_index - b.order_index),
    [sections, id]
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<any>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState("");
  const [addingSectionName, setAddingSectionName] = useState("");
  const [addingSectionOpen, setAddingSectionOpen] = useState(false);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-[#aaa]">
        <p className="text-[14px]">Project not found.</p>
        <button onClick={() => navigate("/projects")} className="mt-3 text-[13px] text-[#db4035] hover:underline">
          Back to projects
        </button>
      </div>
    );
  }

  const openAddTask = (sectionId?: string | null, parentId?: string | null) => {
    setDefaultSectionId(sectionId ?? null);
    setDefaultParentId(parentId ?? null);
    setSheetOpen(true);
  };

  const handleSaveTask    = (data: any) => createTask.mutate({ ...data, project_id: id });
  const handleUpdateTask  = (tid: string, data: any) => updateTask.mutate({ id: tid, data });
  const handleComplete    = (tid: string) => completeTask.mutate(tid);
  const handleDeleteTask  = (tid: string) => { deleteTask.mutate(tid); setDetailTask(null); };
  const handleAddSubtask  = (parentId: string, data: any) => createTask.mutate({ ...data, project_id: id, parent_task_id: parentId });

  const handleAddSection = () => {
    if (!addingSectionName.trim()) return;
    createSection.mutate({ project_id: id, name: addingSectionName.trim(), order_index: projectSections.length });
    setAddingSectionName("");
    setAddingSectionOpen(false);
  };

  const handleRenameSection = (sid: string) => {
    if (!editingSectionName.trim()) return;
    updateSection.mutate({ id: sid, data: { name: editingSectionName.trim() } });
    setEditingSectionId(null);
  };

  const handleSaveProject  = (data: any) => updateProject.mutate({ id: id!, data });
  const handleDeleteProject = () => { deleteProject.mutate(id!); navigate("/projects"); };

  const unsectioned    = projectTasks.filter((t) => !t.sectionId && !t.parentTaskId && t.status !== "completed");
  const completedTasks = projectTasks.filter((t) => !t.parentTaskId && t.status === "completed");

  return (
    <div className="flex flex-col h-full bg-[#f7f7f7]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e5e5e5] sticky top-0 z-10">
        <button onClick={() => navigate("/projects")} className="p-1.5 rounded-lg hover:bg-[#f0f0f0] text-[#777] transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: project.color || "#4073ff" }} />
          <h1 className="text-[16px] font-semibold text-[#202020] truncate">{project.name}</h1>
        </div>
        <div className="relative">
          <button onClick={() => setProjectMenuOpen(!projectMenuOpen)} className="p-1.5 rounded-lg hover:bg-[#f0f0f0] text-[#777] transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {projectMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProjectMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 bg-white border border-[#e5e5e5] rounded-xl shadow-lg py-1 w-40">
                <button onClick={() => { setProjectMenuOpen(false); setEditProjectOpen(true); }} className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#202020] hover:bg-[#f5f5f5]">
                  <Pencil className="h-3.5 w-3.5 text-[#777]" /> Edit project
                </button>
                <button onClick={() => { setProjectMenuOpen(false); setDeleteProjectOpen(true); }} className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-500 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" /> Delete project
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto px-2 py-3">

          {unsectioned.map((task) => (
            <TaskItem key={task.id} task={task} subtasks={tasks.filter((t) => t.parentTaskId === task.id)} onComplete={handleComplete} onDelete={handleDeleteTask} onClick={setDetailTask} />
          ))}

          {projectSections.map((section: any) => {
            const sectionTasks = projectTasks.filter((t) => t.sectionId === String(section.id) && !t.parentTaskId && t.status !== "completed");
            const isEditing = editingSectionId === String(section.id);
            return (
              <div key={section.id} className="mt-4 mb-1">
                <div className="group flex items-center gap-2 px-3 py-1.5">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        autoFocus value={editingSectionName}
                        onChange={(e) => setEditingSectionName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRenameSection(String(section.id)); if (e.key === "Escape") setEditingSectionId(null); }}
                        className="flex-1 text-[13px] font-semibold border border-[#e5e5e5] rounded-lg px-2 py-1 outline-none focus:border-[#db4035]"
                      />
                      <button onClick={() => handleRenameSection(String(section.id))} className="text-green-500"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingSectionId(null)} className="text-[#aaa]"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="h-px flex-1 bg-[#e5e5e5]" />
                      <button onClick={() => { setEditingSectionId(String(section.id)); setEditingSectionName(section.name); }} className="text-[12px] font-semibold text-[#777] uppercase tracking-wide hover:text-[#202020] transition-colors px-2">
                        {section.name}
                      </button>
                      <div className="h-px flex-1 bg-[#e5e5e5]" />
                      <button onClick={() => setDeleteSectionId(String(section.id))} className="p-1 rounded hover:bg-[#f0f0f0] text-[#ccc] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
                {sectionTasks.map((task) => (
                  <TaskItem key={task.id} task={task} subtasks={tasks.filter((t) => t.parentTaskId === task.id)} onComplete={handleComplete} onDelete={handleDeleteTask} onClick={setDetailTask} />
                ))}
                <button onClick={() => openAddTask(String(section.id))} className="flex items-center gap-2 px-3 py-2 w-full text-[13px] text-[#aaa] hover:text-[#555] hover:bg-[#f0f0f0] rounded-lg transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Add task
                </button>
              </div>
            );
          })}

          <button onClick={() => openAddTask(null)} className="flex items-center gap-2 px-3 py-2 w-full text-[13px] text-[#aaa] hover:text-[#555] hover:bg-[#f0f0f0] rounded-lg transition-colors mt-2">
            <Plus className="h-3.5 w-3.5" /> Add task
          </button>

          {addingSectionOpen ? (
            <div className="flex items-center gap-2 mt-3 px-3">
              <input autoFocus value={addingSectionName} onChange={(e) => setAddingSectionName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddSection(); if (e.key === "Escape") { setAddingSectionName(""); setAddingSectionOpen(false); } }}
                placeholder="Section name…" className="flex-1 text-[13px] border border-[#e5e5e5] rounded-xl px-3 py-2 outline-none focus:border-[#db4035]"
              />
              <button onClick={handleAddSection} className="text-[12px] px-3 py-2 bg-[#db4035] text-white rounded-xl hover:bg-[#c0392b] transition-colors">Add</button>
              <button onClick={() => { setAddingSectionName(""); setAddingSectionOpen(false); }} className="text-[#aaa] hover:text-[#555]"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => setAddingSectionOpen(true)} className="flex items-center gap-2 px-3 py-2 w-full text-[13px] text-[#aaa] hover:text-[#555] hover:bg-[#f0f0f0] rounded-lg transition-colors mt-1 border border-dashed border-[#e0e0e0]">
              <Plus className="h-3.5 w-3.5" /> Add section
            </button>
          )}

          {completedTasks.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 px-3 mb-1">
                <div className="h-px flex-1 bg-[#e5e5e5]" />
                <span className="text-[11px] font-semibold text-[#aaa] uppercase tracking-wide px-2">Completed · {completedTasks.length}</span>
                <div className="h-px flex-1 bg-[#e5e5e5]" />
              </div>
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} subtasks={tasks.filter((t) => t.parentTaskId === task.id)} onComplete={handleComplete} onDelete={handleDeleteTask} onClick={setDetailTask} />
              ))}
            </div>
          )}
        </div>
      </div>

      <button onClick={() => openAddTask(null)} className="fixed bottom-20 right-4 z-40 md:bottom-6 h-12 w-12 rounded-full bg-[#db4035] text-white shadow-lg flex items-center justify-center hover:bg-[#c0392b] transition-colors active:scale-95">
        <Plus className="h-5 w-5" />
      </button>

      <TaskSheet open={sheetOpen} onOpenChange={setSheetOpen} onSave={handleSaveTask} projects={projects} sections={sections} labels={labels} people={people} defaultProjectId={id} defaultSectionId={defaultSectionId} defaultParentId={defaultParentId} />

      {detailTask && (
        <TaskDetailModal task={detailTask} projects={projects} sections={sections} users={users} labels={labels} people={people} allTasks={tasks} onClose={() => setDetailTask(null)} onSave={handleUpdateTask} onDelete={handleDeleteTask} onComplete={handleComplete} onAddSubtask={handleAddSubtask} />
      )}

      <ProjectFormModal open={editProjectOpen} onOpenChange={setEditProjectOpen} onSave={handleSaveProject} editProject={project} />

      <AlertDialog open={!!deleteSectionId} onOpenChange={(o) => !o && setDeleteSectionId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle>Delete section?</AlertDialogTitle><AlertDialogDescription>Tasks in this section will become unsectioned.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-[#db4035] hover:bg-[#c0392b]" onClick={() => { if (deleteSectionId) deleteSection.mutate(deleteSectionId); setDeleteSectionId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle><AlertDialogDescription>All tasks and sections will be permanently deleted.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-[#db4035] hover:bg-[#c0392b]" onClick={handleDeleteProject}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
