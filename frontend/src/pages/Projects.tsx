import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Mail, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Project } from "@/data/mockData";

const statusColors = {
  active: "bg-success/10 text-success",
  completed: "bg-primary/10 text-primary",
  on_hold: "bg-warning/10 text-warning",
};

type ProjectForm = {
  name: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  description: string;
  progress: string;
  status: Project["status"];
};

const emptyForm: ProjectForm = {
  name: "",
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  description: "",
  progress: "0",
  status: "active",
};

const Projects = () => {
  const qc = useQueryClient();
  const { data: rawProjects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => api.get<any[]>("/projects") });
  const { data: rawTasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => api.get<any[]>("/tasks") });

  const projects: Project[] = (rawProjects as any[]).map((p) => ({
    id: String(p.id), name: p.name, clientName: p.client_name || "",
    clientEmail: p.client_email || "", clientPhone: p.client_phone || "",
    description: p.description || "", progress: p.progress || 0,
    status: (p.status === "in_progress" ? "active" : p.status) as Project["status"],
    tasks: [], createdAt: p.created_at?.split("T")[0] || "",
  }));
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setEditorOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      clientName: p.clientName,
      clientEmail: p.clientEmail,
      clientPhone: p.clientPhone,
      description: p.description,
      progress: String(p.progress),
      status: p.status,
    });
    setEditorOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: any) => editingId
      ? api.put(`/projects/${editingId}`, payload)
      : api.post("/projects", payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast({ title: editingId ? "Project updated" : "Project created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast({ title: "Project deleted" }); },
  });

  const save = () => {
    if (!form.name.trim() || !form.clientName.trim()) {
      toast({ title: "Missing info", description: "Project name and client are required.", variant: "destructive" }); return;
    }
    const progress = Math.min(100, Math.max(0, Number(form.progress) || 0));
    const statusToApi: Record<string, string> = { active: "in_progress", on_hold: "on_hold", completed: "completed" };
    saveMutation.mutate({
      name: form.name, description: form.description,
      client_name: form.clientName, client_email: form.clientEmail,
      client_phone: form.clientPhone, status: statusToApi[form.status] ?? form.status, progress,
    });
    setEditorOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your client projects</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const projectTasks = (rawTasks as any[]).filter((t: any) => String(t.project_id) === project.id);
          return (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  </div>
                  <Badge className={statusColors[project.status]} variant="secondary">{project.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" /> {project.clientName}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> {project.clientEmail}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>{projectTasks.length} tasks</span>
                  <span>Created {project.createdAt}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(project)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(project.id)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Editor */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Project" : "New Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="proj-name">Project Name *</Label>
              <Input id="proj-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea id="proj-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="proj-client">Client Name *</Label>
                <Input id="proj-client" placeholder="e.g. Rahul Sharma" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-email">Client Email</Label>
                <Input id="proj-email" type="email" placeholder="e.g. rahul@example.com" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-phone">Client Phone</Label>
                <Input id="proj-phone" type="tel" inputMode="numeric" placeholder="e.g. +91 98765 43210" value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value.replace(/[^0-9+\s\-()]/g, "") })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-progress">Progress (%)</Label>
                <Input id="proj-progress" type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Project["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editingId ? "Save Changes" : "Create Project"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Projects;
