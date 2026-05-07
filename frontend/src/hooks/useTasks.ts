import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useTasks() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: rawTasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.get<any[]>("/tasks"),
  });

  const { data: rawSections = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: () => api.get<any[]>("/tasks/sections"),
  });

  const { data: rawProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<any[]>("/projects"),
  });

  const { data: rawUsers = [] } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () => api.get<any[]>("/auth/staff-list"),
  });

  const tasks = (rawTasks as any[]).map((t) => ({
    id: String(t.id),
    title: t.title,
    description: t.description || "",
    status: t.status as string,
    priority: (t.priority || "medium") as "low" | "medium" | "high" | "urgent",
    deadline: t.due_date ? t.due_date.slice(0, 16) : "",
    projectId: t.project_id ? String(t.project_id) : null,
    projectName: t.project_name || null,
    sectionId: t.section_id ? String(t.section_id) : null,
    sectionName: t.section_name || null,
    parentTaskId: t.parent_task_id ? String(t.parent_task_id) : null,
    depthLevel: t.depth_level || 0,
    orderIndex: t.order_index || 0,
    assignedTo: t.assigned_to ?? null,
    assignedToName: t.assigned_to_name || "",
    labels: t.labels ? String(t.labels).split(",").map((l: string) => l.trim()).filter(Boolean) : [],
    recurringRule: t.recurring_rule || null,
  }));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  const createTask = useMutation({
    mutationFn: (data: any) => api.post("/tasks", data),
    onSuccess: () => { invalidate(); toast({ title: "Task created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/tasks/${id}`, data),
    onSuccess: () => { invalidate(); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const completeTask = useMutation({
    mutationFn: (id: string) => api.put(`/tasks/${id}/complete`, {}),
    onSuccess: (res: any) => {
      invalidate();
      toast({ title: "Task completed!", description: res?.credits?.credits > 0 ? "+2 credits!" : undefined });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => { invalidate(); toast({ title: "Task deleted" }); },
  });

  const createSection = useMutation({
    mutationFn: (data: any) => api.post("/tasks/sections", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sections"] }),
  });

  const updateSection = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/tasks/sections/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sections"] }),
  });

  const deleteSection = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/sections/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sections"] });
      invalidate();
    },
  });

  return {
    tasks,
    sections: rawSections as any[],
    projects: rawProjects as any[],
    users: rawUsers as any[],
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    createSection,
    updateSection,
    deleteSection,
  };
}
