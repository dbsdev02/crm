import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MentionTextarea from "@/components/MentionTextarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle2, ListChecks, Pencil, Trash2, Search, X, Tag } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Task } from "@/data/mockData";
import { useCustomers } from "@/contexts/CustomersContext";
import { useLabels } from "@/contexts/LabelsContext";
import { cn } from "@/lib/utils";

type View = "today" | "upcoming" | "all" | "completed";

const CARD_COLORS = ["bg-[#FFD6C8]", "bg-[#C8E8FF]", "bg-[#C8FFD6]", "bg-[#F5C8FF]", "bg-[#FFF5C8]"];

const todayStr = () => new Date().toISOString().split("T")[0];
const nowDateTimeLocal = () => { const d = new Date(); d.setSeconds(0, 0); return d.toISOString().slice(0, 16); };
const isOverdue = (deadline: string, status: string) => status !== "completed" && deadline.slice(0, 10) < todayStr();

const daysLeft = (deadline: string) => {
  const diff = Math.round((new Date(deadline.slice(0, 10)).getTime() - new Date(todayStr()).getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "1 day left";
  return `${diff} days left`;
};

const initials = (name?: string) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

const LABEL_COLORS: Record<string, string> = {
  bug: "bg-red-100 text-red-700",
  feature: "bg-blue-100 text-blue-700",
  design: "bg-purple-100 text-purple-700",
  urgent: "bg-orange-100 text-orange-700",
  review: "bg-yellow-100 text-yellow-700",
  backend: "bg-slate-100 text-slate-700",
  frontend: "bg-cyan-100 text-cyan-700",
};
const labelColor = (l: string) => LABEL_COLORS[l.toLowerCase()] ?? "bg-gray-100 text-gray-700";

interface TaskFormState {
  title: string; description: string; deadline: string;
  priority: Task["priority"]; projectId: string; customerId: string;
  assignedTo: string; labels: string[];
}
const emptyForm = (): TaskFormState => ({
  title: "", description: "", deadline: nowDateTimeLocal(),
  priority: "medium", projectId: "none", customerId: "none", assignedTo: "none", labels: [],
});

const Tasks = () => {
  const qc = useQueryClient();
  const { data: rawTasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => api.get<any[]>("/tasks") });
  const { data: rawProjects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => api.get<any[]>("/projects") });
  const { data: rawUsers = [] } = useQuery({ queryKey: ["staff-list"], queryFn: () => api.get<any[]>("/auth/staff-list") });
  const allProjects = rawProjects as any[];
  const allUsers = rawUsers as any[];
  const { customers } = useCustomers();
  const { labels: globalLabels, activeFilter, setActiveFilter } = useLabels();
  const { toast } = useToast();

  const tasks = (rawTasks as any[]).map((t) => ({
    id: String(t.id), title: t.title, description: t.description || "",
    assignedToName: t.assigned_to_name || "",
    assignedTo: t.assigned_to ?? null,
    labels: t.labels ? (t.labels as string).split(",").map((l: string) => l.trim()).filter(Boolean) : [],
    projectId: t.project_id ? String(t.project_id) : undefined,
    deadline: t.due_date ? t.due_date.slice(0, 16) : "",
    status: t.status, priority: t.priority as Task["priority"],
  }));

  const [view, setView] = useState<View>("today");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm());

  const saveMutation = useMutation({
    mutationFn: (payload: any) => editingId ? api.put(`/tasks/${editingId}`, payload) : api.post("/tasks", payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast({ title: editingId ? "Task updated" : "Task created" }); setDialogOpen(false); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const completeMutation = useMutation({
    mutationFn: (id: string) => api.put(`/tasks/${id}/complete`, {}),
    onSuccess: (data: any) => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast({ title: "Task completed!", description: data?.credits?.credits > 0 ? "+2 credits!" : "+1 point" }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast({ title: "Task deleted" }); },
  });

  const counts = useMemo(() => ({
    today: tasks.filter((t) => t.status !== "completed" && t.deadline.slice(0, 10) <= todayStr()).length,
    upcoming: tasks.filter((t) => t.status !== "completed" && t.deadline.slice(0, 10) > todayStr()).length,
    all: tasks.filter((t) => t.status !== "completed").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }), [tasks]);

  const filtered = useMemo(() => {
    const today = todayStr();
    let list = tasks;
    if (view === "today") list = tasks.filter((t) => t.status !== "completed" && t.deadline.slice(0, 10) <= today);
    else if (view === "upcoming") list = tasks.filter((t) => t.status !== "completed" && t.deadline.slice(0, 10) > today);
    else if (view === "completed") list = tasks.filter((t) => t.status === "completed");
    else list = tasks.filter((t) => t.status !== "completed");
    if (search.trim()) list = list.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    if (activeFilter) list = list.filter((t) => t.labels.includes(activeFilter));
    return [...list].sort((a, b) => a.deadline < b.deadline ? -1 : 1);
  }, [tasks, view, search, activeFilter]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (task: any) => {
    setEditingId(task.id);
    setForm({ title: task.title, description: task.description, deadline: task.deadline.length === 10 ? task.deadline + "T00:00" : task.deadline, priority: task.priority, projectId: task.projectId ?? "none", customerId: "none", assignedTo: task.assignedTo ? String(task.assignedTo) : "none", labels: task.labels ?? [] });
    setDialogOpen(true);
  };
  const submitForm = () => {
    if (!form.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    saveMutation.mutate({ title: form.title.trim(), description: form.description.trim(), due_date: form.deadline, priority: form.priority, project_id: form.projectId === "none" ? null : form.projectId, assigned_to: form.assignedTo === "none" ? null : Number(form.assignedTo), labels: form.labels, ...(editingId ? { status: "pending" } : {}) });
  };

  const viewTabs: { key: View; label: string; count: number }[] = [
    { key: "today", label: "Due Today", count: counts.today },
    { key: "upcoming", label: "Upcoming", count: counts.upcoming },
    { key: "all", label: "All", count: counts.all },
    { key: "completed", label: "Completed", count: counts.completed },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Desktop sidebar — Views only */}
      <aside className="hidden lg:block lg:w-52 shrink-0 space-y-1">
        <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Views</h2>
        {viewTabs.map((v) => (
          <button key={v.key} onClick={() => setView(v.key)}
            className={cn("w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              view === v.key ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground")}>
            <span>{v.label}</span>
            {v.count > 0 && <span className="text-xs text-muted-foreground">{v.count}</span>}
          </button>
        ))}

        {/* Active label filter indicator */}
        {activeFilter && (
          <div className="mt-3 px-3">
            <div className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-2 py-1.5">
              <Tag className="h-3 w-3 shrink-0" />
              <span className="flex-1 truncate">Filter: <b>{activeFilter}</b></span>
              <button onClick={() => setActiveFilter(null)}><X className="h-3 w-3" /></button>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold">Tasks</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-36 sm:w-48" />
              {search && <button onClick={() => setSearch("")} className="absolute right-2 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
            </div>
            <Button className="hidden sm:flex" onClick={openCreate}><Plus className="mr-1 h-4 w-4" />Add Task</Button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
          {viewTabs.map((v) => (
            <button key={v.key} onClick={() => setView(v.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors shrink-0",
                view === v.key ? "bg-primary text-primary-foreground font-medium" : "bg-muted text-muted-foreground"
              )}>
              {v.label}
              {v.count > 0 && (
                <span className={cn("text-xs rounded-full px-1.5 min-w-[20px] text-center", view === v.key ? "bg-white/20" : "bg-background")}>
                  {v.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Task cards */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ListChecks className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">{search ? "No tasks match your search." : "Nothing here. Enjoy the calm!"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((task, i) => {
              const overdue = isOverdue(task.deadline, task.status);
              const completed = task.status === "completed";
              const cardColor = completed ? "bg-muted" : overdue ? "bg-[#FFD6C8]" : CARD_COLORS[i % CARD_COLORS.length];
              return (
                <div key={task.id} className={cn("rounded-2xl p-4 flex items-start gap-3", cardColor)}>
                  <div className="h-9 w-9 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    {initials(task.assignedToName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-semibold text-sm leading-snug", completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                    {task.description && <p className="text-xs text-foreground/60 mt-0.5 line-clamp-1">{task.description}</p>}
                    {task.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.labels.map((l: string) => (
                          <span key={l} className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5", labelColor(l))}>
                            <Tag className="h-2.5 w-2.5" />{l}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={cn("text-xs font-medium", overdue ? "text-red-600" : "text-foreground/60")}>
                        {daysLeft(task.deadline)}
                      </span>
                      {task.status === "in_progress" && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">in progress</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {!completed && (
                      <button onClick={() => completeMutation.mutate(task.id)}
                        className="h-8 w-8 rounded-full border-2 border-foreground/20 bg-white/40 flex items-center justify-center hover:bg-white/70 transition-colors">
                        <CheckCircle2 className="h-4 w-4 text-foreground/40" />
                      </button>
                    )}
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(task)} className="h-6 w-6 rounded-full bg-white/40 flex items-center justify-center hover:bg-white/70">
                        <Pencil className="h-3 w-3 text-foreground/60" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="h-6 w-6 rounded-full bg-white/40 flex items-center justify-center hover:bg-red-100">
                            <Trash2 className="h-3 w-3 text-destructive/60" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete task?</AlertDialogTitle>
                            <AlertDialogDescription>"{task.title}" will be permanently removed.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(task.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB — mobile only */}
      <button onClick={openCreate}
        className="fixed bottom-20 right-4 z-40 md:hidden h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center">
        <Plus className="h-6 w-6" />
      </button>

      {/* Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Task name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
            <MentionTextarea
              placeholder="Description — type @ to mention staff or client"
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
              staff={allUsers.map((u: any) => ({ id: String(u.id), name: u.name, type: "staff" as const }))}
              customers={customers.map((c) => ({ id: String(c.id), name: c.name, type: "customer" as const }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Due date & time</label>
                <Input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Task["priority"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">P1 — High</SelectItem>
                    <SelectItem value="medium">P2 — Medium</SelectItem>
                    <SelectItem value="low">P3 — Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Project</label>
                <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {allProjects.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Labels</label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {globalLabels.map((l) => (
                    <button
                      key={l} type="button"
                      onClick={() => setForm((f) => ({
                        ...f,
                        labels: f.labels.includes(l) ? f.labels.filter((x) => x !== l) : [...f.labels, l],
                      }))}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium border transition-all",
                        labelColor(l),
                        form.labels.includes(l) ? "ring-2 ring-offset-1 ring-primary" : "opacity-60 hover:opacity-100"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {/* Label dropdown */}
                <Select
                  value=""
                  onValueChange={(v) => {
                    if (v && !form.labels.includes(v))
                      setForm((f) => ({ ...f, labels: [...f.labels, v] }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add a label…" />
                  </SelectTrigger>
                  <SelectContent>
                    {globalLabels.filter((l) => !form.labels.includes(l)).map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.labels.filter((l) => !globalLabels.includes(l)).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {form.labels.filter((l) => !globalLabels.includes(l)).map((l) => (
                      <span key={l} className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1", labelColor(l))}>
                        {l}
                        <button type="button" onClick={() => setForm((f) => ({ ...f, labels: f.labels.filter((x) => x !== l) }))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Assign to Staff</label>
                <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
                  <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {allUsers.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitForm} disabled={saveMutation.isPending}>{editingId ? "Save" : "Add task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
