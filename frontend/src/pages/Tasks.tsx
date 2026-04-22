import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  CalendarDays,
  CalendarClock,
  ListChecks,
  Flag,
  Pencil,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { mockProjects, Task } from "@/data/mockData";
import { useCustomers } from "@/contexts/CustomersContext";
import { cn } from "@/lib/utils";

type View = "today" | "upcoming" | "all" | "completed";

const priorityMeta: Record<
  Task["priority"],
  { label: string; flag: string; badge: string }
> = {
  high: { label: "P1", flag: "text-destructive", badge: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "P2", flag: "text-warning", badge: "bg-warning/10 text-warning border-warning/20" },
  low: { label: "P3", flag: "text-muted-foreground", badge: "bg-muted text-muted-foreground border-border" },
};

const todayStr = () => new Date().toISOString().split("T")[0];
const nowDateTimeLocal = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
};
const isOverdue = (deadline: string, status: Task["status"]) =>
  status !== "completed" && new Date(deadline) < new Date(todayStr());

const formatDate = (date: string) => {
  const d = new Date(date);
  const t = new Date(todayStr());
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

interface TaskFormState {
  title: string;
  description: string;
  deadline: string;
  priority: Task["priority"];
  projectId: string;
  customerId: string;
}

const emptyForm = (): TaskFormState => ({
  title: "",
  description: "",
  deadline: nowDateTimeLocal(),
  priority: "medium",
  projectId: "none",
  customerId: "none",
});

const Tasks = () => {
  const qc = useQueryClient();
  const { data: rawTasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => api.get<any[]>("/tasks") });
  const { data: rawProjects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => api.get<any[]>("/projects") });
  const allProjects = rawProjects as any[];

  const tasks: Task[] = (rawTasks as any[]).map((t) => ({
    id: String(t.id), title: t.title, description: t.description || "",
    assignedTo: [String(t.assigned_to || "")],
    projectId: t.project_id ? String(t.project_id) : undefined,
    customerId: t.customer_id ? String(t.customer_id) : undefined,
    deadline: t.due_date ? t.due_date.slice(0, 16) : "",
    completedAt: t.completed_at || undefined,
    status: t.status, priority: t.priority, createdBy: String(t.assigned_by || ""),
  }));

  const [view, setView] = useState<View>("today");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm());
  const [quickAdd, setQuickAdd] = useState("");
  const { customers } = useCustomers();
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: (payload: any) => editingId
      ? api.put(`/tasks/${editingId}`, payload)
      : api.post("/tasks", payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast({ title: editingId ? "Task updated" : "Task created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const completeMutation = useMutation({
    mutationFn: (id: string) => api.put(`/tasks/${id}/complete`, {}),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      const msg = data?.credits?.credits > 0 ? "+2 credits (early!)" : "+1 point";
      toast({ title: "Task completed!", description: msg });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast({ title: "Task deleted" }); },
  });

  const counts = useMemo(() => {
    const today = todayStr();
    return {
      today: tasks.filter((t) => t.status !== "completed" && t.deadline <= today).length,
      upcoming: tasks.filter((t) => t.status !== "completed" && t.deadline > today).length,
      all: tasks.filter((t) => t.status !== "completed").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    const today = todayStr();
    let list = tasks;
    if (view === "today") list = tasks.filter((t) => t.status !== "completed" && t.deadline <= today);
    else if (view === "upcoming") list = tasks.filter((t) => t.status !== "completed" && t.deadline > today);
    else if (view === "completed") list = tasks.filter((t) => t.status === "completed");
    else list = tasks.filter((t) => t.status !== "completed");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }
    // sort: overdue first, then by date, then priority
    const prio = { high: 0, medium: 1, low: 2 };
    return [...list].sort((a, b) => {
      if (a.deadline !== b.deadline) return a.deadline < b.deadline ? -1 : 1;
      return prio[a.priority] - prio[b.priority];
    });
  }, [tasks, view, search]);

  const grouped = useMemo(() => {
    const today = todayStr();
    const groups: { key: string; label: string; items: Task[] }[] = [];
    const overdue = filtered.filter((t) => t.status !== "completed" && t.deadline < today);
    const todayItems = filtered.filter((t) => t.deadline === today && t.status !== "completed");
    const upcoming = filtered.filter((t) => t.deadline > today && t.status !== "completed");
    const completed = filtered.filter((t) => t.status === "completed");

    if (overdue.length) groups.push({ key: "overdue", label: "Overdue", items: overdue });
    if (todayItems.length) groups.push({ key: "today", label: "Today", items: todayItems });
    if (upcoming.length) groups.push({ key: "upcoming", label: "Upcoming", items: upcoming });
    if (completed.length) groups.push({ key: "completed", label: "Completed", items: completed });
    return groups;
  }, [filtered]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      deadline: task.deadline.length === 10 ? task.deadline + "T00:00" : task.deadline,
      priority: task.priority,
      projectId: task.projectId ?? "none",
      customerId: task.customerId ?? "none",
    });
    setDialogOpen(true);
  };

  const submitForm = () => {
    if (!form.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    saveMutation.mutate({
      title: form.title.trim(), description: form.description.trim(),
      due_date: form.deadline, priority: form.priority,
      project_id: form.projectId === "none" ? null : form.projectId,
      customer_id: form.customerId === "none" ? null : form.customerId,
      ...(editingId ? { status: "pending" } : {}),
    });
    setDialogOpen(false);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAdd.trim()) return;
    saveMutation.mutate({ title: quickAdd.trim(), description: "", due_date: todayStr(), priority: "medium" });
    setQuickAdd("");
  };

  const toggleComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === "completed") return;
    completeMutation.mutate(taskId);
  };

  const deleteTask = (taskId: string) => deleteMutation.mutate(taskId);

  const viewMeta: { key: View; label: string; icon: typeof Inbox; count: number }[] = [
    { key: "today", label: "Today", icon: CalendarDays, count: counts.today },
    { key: "upcoming", label: "Upcoming", icon: CalendarClock, count: counts.upcoming },
    { key: "all", label: "All Tasks", icon: Inbox, count: counts.all },
    { key: "completed", label: "Completed", icon: CheckCircle2, count: counts.completed },
  ];

  const projectName = (id?: string) =>
    id ? (allProjects as any[]).find((p: any) => String(p.id) === id)?.name : undefined;
  const customerName = (id?: string) =>
    id ? customers.find((c) => c.id === id)?.name : undefined;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <aside className="lg:w-60 shrink-0 space-y-1">
        <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Views
        </h2>
        {viewMeta.map((v) => {
          const Icon = v.icon;
          const active = view === v.key;
          return (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {v.label}
              </span>
              {v.count > 0 && (
                <span className="text-xs text-muted-foreground">{v.count}</span>
              )}
            </button>
          );
        })}
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {viewMeta.find((v) => v.key === view)?.label}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "task" : "tasks"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-48"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus className="mr-1 h-4 w-4" /> Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Task" : "New Task"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Task name"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    autoFocus
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground mb-1 block">Due date & time</label>
                      <Input
                        type="datetime-local"
                        value={form.deadline}
                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                      <Select
                        value={form.priority}
                        onValueChange={(v) => setForm({ ...form, priority: v as Task["priority"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">P1 — High</SelectItem>
                          <SelectItem value="medium">P2 — Medium</SelectItem>
                          <SelectItem value="low">P3 — Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Project</label>
                      <Select
                        value={form.projectId}
                        onValueChange={(v) => setForm({ ...form, projectId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No project</SelectItem>
                          {(allProjects as any[]).map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Customer</label>
                      <Select
                        value={form.customerId}
                        onValueChange={(v) => setForm({ ...form, customerId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No customer</SelectItem>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} — {c.company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submitForm}>{editingId ? "Save changes" : "Add task"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick add */}
        {view !== "completed" && (
          <form
            onSubmit={handleQuickAdd}
            className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 hover:border-primary/50 transition-colors"
          >
            <Plus className="h-4 w-4 text-primary ml-1" />
            <Input
              placeholder="Quick add task — press Enter"
              value={quickAdd}
              onChange={(e) => setQuickAdd(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
            />
            {quickAdd && (
              <Button type="submit" size="sm">
                Add
              </Button>
            )}
          </form>
        )}

        {/* Task groups */}
        {grouped.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ListChecks className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? "No tasks match your search." : "Nothing here. Enjoy the calm!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          grouped.map((group) => (
            <Card key={group.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {group.key === "overdue" && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  <span className={group.key === "overdue" ? "text-destructive" : ""}>
                    {group.label}
                  </span>
                  <Badge variant="secondary" className="ml-1">
                    {group.items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 divide-y divide-border">
                {group.items.map((task) => {
                  const meta = priorityMeta[task.priority];
                  const overdue = task.status === "overdue";
                  const completed = task.status === "completed";
                  return (
                    <div
                      key={task.id}
                      className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="mt-0.5"
                        aria-label="Toggle complete"
                      >
                        <Checkbox checked={completed} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              completed && "line-through text-muted-foreground"
                            )}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openEdit(task)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete task?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{task.title}" will be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteTask(task.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs",
                              overdue ? "text-destructive font-medium" : "text-muted-foreground"
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {formatDate(task.deadline)}
                            {task.deadline.length > 10 && (
                              <span className="ml-0.5">
                                {new Date(task.deadline).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                              </span>
                            )}
                          </span>
                          <Badge variant="outline" className={cn("text-xs gap-1", meta.badge)}>
                            <Flag className={cn("h-3 w-3", meta.flag)} />
                            {meta.label}
                          </Badge>
                          {projectName(task.projectId) && (
                            <Badge variant="secondary" className="text-xs">
                              # {projectName(task.projectId)}
                            </Badge>
                          )}
                          {customerName(task.customerId) && (
                            <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                              @ {customerName(task.customerId)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Tasks;
