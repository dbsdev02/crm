import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectFormModal } from "@/components/project/ProjectFormModal";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_GROUPS = [
  { key: "active",    label: "Active" },
  { key: "planning",  label: "Planning" },
  { key: "on_hold",   label: "On Hold" },
  { key: "completed", label: "Completed" },
];

const Projects = () => {
  const navigate = useNavigate();
  const { projects, createProject, updateProject, deleteProject } = useProjects();
  const { data: rawTasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => api.get<any[]>("/tasks") });

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const taskCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    (rawTasks as any[]).forEach((t: any) => {
      if (t.project_id && t.status !== "completed") {
        const key = String(t.project_id);
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [rawTasks]);

  const filtered = useMemo(() =>
    projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [projects, search]
  );

  const handleSave = (data: any) => {
    if (editProject) updateProject.mutate({ id: editProject.id, data });
    else createProject.mutate(data);
    setEditProject(null);
  };

  const openEdit = (p: any) => { setEditProject(p); setFormOpen(true); };
  const openAdd  = () => { setEditProject(null); setFormOpen(true); };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-[#202020]">Projects</h1>
        <div className="flex items-center gap-2">
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
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#db4035] text-white text-[13px] font-medium rounded-xl hover:bg-[#c0392b] transition-colors"
          >
            <Plus className="h-4 w-4" /> New project
          </button>
        </div>
      </div>

      {/* Grouped by status */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[14px] text-[#aaa]">{search ? "No projects match your search." : "No projects yet. Create your first one."}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {STATUS_GROUPS.map(({ key, label }) => {
            const group = filtered.filter((p) => p.status === key || (key === "active" && p.status === "in_progress"));
            if (group.length === 0) return null;
            return (
              <div key={key}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#aaa] px-3 mb-1">{label}</p>
                <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden divide-y divide-[#f5f5f5]">
                  {group.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      taskCount={taskCountMap[project.id] || 0}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      onEdit={() => openEdit(project)}
                      onDelete={() => setDeleteId(project.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      <ProjectFormModal
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditProject(null); }}
        onSave={handleSave}
        editProject={editProject}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>All tasks and sections in this project will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-[#db4035] hover:bg-[#c0392b]"
              onClick={() => { if (deleteId) deleteProject.mutate(deleteId); setDeleteId(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Projects;
