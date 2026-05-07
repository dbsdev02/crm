import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const PROJECT_COLORS = [
  { label: "Red",    value: "#db4035" },
  { label: "Orange", value: "#ff9a14" },
  { label: "Yellow", value: "#fad000" },
  { label: "Green",  value: "#7ecc49" },
  { label: "Teal",   value: "#299438" },
  { label: "Blue",   value: "#4073ff" },
  { label: "Purple", value: "#a970ff" },
  { label: "Pink",   value: "#e05194" },
  { label: "Slate",  value: "#808080" },
];

export function useProjects() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: raw = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<any[]>("/projects"),
  });

  const projects = (raw as any[]).map((p) => ({
    id: String(p.id),
    name: p.name,
    description: p.description || "",
    color: p.color || "#4073ff",
    status: (p.status === "in_progress" ? "active" : p.status) as string,
    progress: p.progress || 0,
    clientName: p.client_name || "",
    clientEmail: p.client_email || "",
    clientPhone: p.client_phone || "",
    createdAt: p.created_at?.split("T")[0] || "",
  }));

  const invalidate = () => qc.invalidateQueries({ queryKey: ["projects"] });

  const createProject = useMutation({
    mutationFn: (data: any) => api.post("/projects", data),
    onSuccess: () => { invalidate(); toast({ title: "Project created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/projects/${id}`, data),
    onSuccess: () => { invalidate(); toast({ title: "Project updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => { invalidate(); toast({ title: "Project deleted" }); },
  });

  return { projects, createProject, updateProject, deleteProject };
}
