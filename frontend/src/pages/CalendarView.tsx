import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Video, CheckSquare, X, ExternalLink, Users } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-500", medium: "text-orange-400", low: "text-blue-400", urgent: "text-gray-400",
};

type Form = {
  title: string;
  date: string;
  time: string;
  projectId: string;
  memberIds: number[];
  memberQuery: string;
};

const emptyForm = (): Form => ({
  title: "", date: "", time: "10:00", projectId: "none", memberIds: [], memberQuery: "",
});

const CalendarView = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: rawMeetings = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => api.get<any[]>("/meetings"),
  });

  const { data: rawTasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.get<any[]>("/tasks"),
  });

  const { data: rawProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<any[]>("/projects"),
  });

  const { data: rawStaff = [] } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () => api.get<any[]>("/auth/staff-list"),
  });

  const tasks = (rawTasks as any[]).filter((t) => t.due_date && t.status !== "completed").map((t) => ({
    id: String(t.id),
    title: t.title,
    date: t.due_date.slice(0, 10),
    time: t.due_date.length > 10
      ? new Date(t.due_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      : "",
    priority: t.priority || "medium",
    status: t.status,
  }));

  const meetings = (rawMeetings as any[]).map((m) => ({
    id: String(m.id),
    title: m.title,
    date: m.meeting_date?.split("T")[0] || "",
    time: m.meeting_date
      ? new Date(m.meeting_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
      : "",
    meetLink: m.meeting_link || "",
    projectId: m.project_id ? String(m.project_id) : null,
    projectName: m.project_name || null,
    participants: Array.isArray(m.participants) ? m.participants : [],
  }));

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: any }) =>
      id ? api.put(`/meetings/${id}`, payload) : api.post("/meetings", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/meetings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState("");
  const [memberDropOpen, setMemberDropOpen] = useState(false);

  const { data: googleStatus, isError: googleError } = useQuery({
    queryKey: ["google-status"],
    queryFn: () => api.get<{ connected: boolean }>("/google/status"),
    retry: false,
  });
  const googleConnected = googleStatus?.connected === true;

  const connectGoogle = async () => {
    const { url } = await api.get<{ url: string }>("/google/auth");
    window.open(url, "_blank", "width=600,height=700");
  };

  const generateMeet = async () => {
    if (!googleConnected) {
      toast({ title: "Connect Google first", variant: "destructive" });
      return;
    }
    try {
      const start = new Date(`${form.date}T${form.time}:00`);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const { meetLink: link } = await api.post<{ meetLink: string }>("/google/create-meet", {
        title: form.title || "CRM Meeting",
        description: "",
        start: start.toISOString(),
        end: end.toISOString(),
        attendees: (rawStaff as any[])
          .filter((s) => form.memberIds.includes(s.id))
          .map((s) => s.email)
          .filter(Boolean),
      });
      setMeetLink(link);
      toast({ title: "Meet link generated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const selectedDateStr = date ? toDateStr(date) : "";
  const todayMeetings = useMemo(() => meetings.filter((m) => m.date === selectedDateStr), [meetings, selectedDateStr]);
  const todayTasks    = useMemo(() => tasks.filter((t) => t.date === selectedDateStr), [tasks, selectedDateStr]);
  const meetingDates  = useMemo(() => meetings.map((m) => new Date(m.date + "T00:00:00")), [meetings]);
  const taskDates     = useMemo(() => tasks.map((t) => new Date(t.date + "T00:00:00")), [tasks]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), date: selectedDateStr || toDateStr(new Date()) });
    setMeetLink("");
    setEditorOpen(true);
  };

  const openEdit = (m: typeof meetings[0]) => {
    setEditingId(m.id);
    setForm({
      title: m.title,
      date: m.date,
      time: m.time,
      projectId: m.projectId || "none",
      memberIds: m.participants.map((p: any) => p.id),
      memberQuery: "",
    });
    setMeetLink(m.meetLink || "");
    setEditorOpen(true);
  };

  const save = () => {
    if (!form.title.trim() || !form.date) {
      toast({ title: "Title and date are required.", variant: "destructive" });
      return;
    }
    const meeting_date = `${form.date}T${form.time || "10:00"}:00`;
    saveMutation.mutate({
      id: editingId,
      payload: {
        title: form.title,
        meeting_date,
        meeting_link: meetLink || null,
        project_id: form.projectId === "none" ? null : form.projectId,
        participants: form.memberIds,
      },
    });
    toast({ title: editingId ? "Meeting updated" : "Meeting added" });
    setEditorOpen(false);
  };

  const toggleMember = (id: number) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter((x) => x !== id) : [...f.memberIds, id],
      memberQuery: "",
    }));
    setMemberDropOpen(false);
  };

  const removeMember = (id: number) =>
    setForm((f) => ({ ...f, memberIds: f.memberIds.filter((x) => x !== id) }));

  const filteredStaff = (rawStaff as any[]).filter(
    (s) => !form.memberIds.includes(s.id) &&
      s.name.toLowerCase().includes(form.memberQuery.toLowerCase())
  );

  const getMemberName = (id: number) =>
    (rawStaff as any[]).find((s) => s.id === id)?.name || String(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">View and schedule meetings</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Meeting
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <Card>
          <CardContent className="pt-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              modifiers={{ hasMeeting: meetingDates, hasTask: taskDates }}
              modifiersClassNames={{
                hasMeeting: "font-bold text-primary underline underline-offset-4",
                hasTask: "font-bold text-[#db4035]",
              }}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayMeetings.length === 0 && todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No meetings or tasks scheduled for this day.</p>
            ) : (
              <div className="space-y-4">
                {todayTasks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-[#aaa] uppercase tracking-wider">Tasks</p>
                    {todayTasks.map((task) => (
                      <div key={task.id} className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2",
                        task.status === "overdue" ? "border-red-200 bg-red-50" : "border-[#f0f0f0] bg-white"
                      )}>
                        <CheckSquare className={cn("h-4 w-4 shrink-0", PRIORITY_COLOR[task.priority])} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#202020] truncate">{task.title}</p>
                          {task.time && <p className="text-[11px] text-[#888]">{task.time}</p>}
                        </div>
                        <span className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                          task.status === "overdue" ? "bg-red-100 text-red-600" : "bg-[#f5f5f5] text-[#777]"
                        )}>
                          {task.status === "overdue" ? "Overdue" : task.priority.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {todayMeetings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-[#aaa] uppercase tracking-wider">Meetings</p>
                    {todayMeetings.map((meeting) => (
                      <div key={meeting.id} className="rounded-lg border border-border p-3 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-[13px]">{meeting.title}</p>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary">{meeting.time}</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(meeting)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(meeting.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {meeting.projectName && (
                          <p className="text-[11px] text-[#888]">📁 {meeting.projectName}</p>
                        )}
                        {meeting.participants.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <Users className="h-3 w-3 text-[#aaa]" />
                            {meeting.participants.map((p: any) => (
                              <span key={p.id} className="text-[11px] bg-[#f0f0f0] text-[#555] px-1.5 py-0.5 rounded-full">
                                {p.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {meeting.meetLink && (
                          <a
                            href={meeting.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            <Video className="h-3 w-3" /> Join Meet
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Meetings */}
      <Card>
        <CardHeader><CardTitle className="text-lg">All Meetings</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {meetings.length === 0 && (
              <p className="text-sm text-muted-foreground">No meetings yet.</p>
            )}
            {meetings.map((meeting) => (
              <div key={meeting.id} className="flex items-start justify-between rounded-lg border border-border p-3 gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground">{meeting.date} at {meeting.time}</p>
                  {meeting.projectName && (
                    <p className="text-[11px] text-[#888]">📁 {meeting.projectName}</p>
                  )}
                  {meeting.participants.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Users className="h-3 w-3 text-[#aaa]" />
                      {meeting.participants.map((p: any) => (
                        <span key={p.id} className="text-[11px] bg-[#f0f0f0] text-[#555] px-1.5 py-0.5 rounded-full">
                          {p.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {meeting.meetLink && (
                    <a
                      href={meeting.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <Video className="h-3 w-3" /> Join Meet <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(meeting)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(meeting.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Meeting" : "Add Meeting"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>

            {/* Project */}
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {(rawProjects as any[]).map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Member Tagging */}
            <div className="space-y-1.5">
              <Label>Tag Members</Label>
              {/* Selected member chips */}
              {form.memberIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {form.memberIds.map((id) => (
                    <span key={id} className="flex items-center gap-1 text-[12px] bg-[#f0f0f0] text-[#333] px-2 py-0.5 rounded-full">
                      @{getMemberName(id)}
                      <button onClick={() => removeMember(id)} className="text-[#aaa] hover:text-[#555]">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Search input */}
              <div className="relative">
                <Input
                  placeholder="@ type to search members..."
                  value={form.memberQuery}
                  onChange={(e) => {
                    setForm({ ...form, memberQuery: e.target.value });
                    setMemberDropOpen(true);
                  }}
                  onFocus={() => setMemberDropOpen(true)}
                  onBlur={() => setTimeout(() => setMemberDropOpen(false), 150)}
                />
                {memberDropOpen && filteredStaff.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#e5e5e5] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredStaff.map((s: any) => (
                      <button
                        key={s.id}
                        onMouseDown={() => toggleMember(s.id)}
                        className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#f5f5f5] flex items-center gap-2"
                      >
                        <span className="text-[#aaa]">@</span>
                        <span>{s.name}</span>
                        <span className="ml-auto text-[11px] text-[#bbb]">{s.role}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Google Meet */}
            {!googleConnected ? (
              <Button type="button" variant="outline" onClick={connectGoogle} className="w-full">
                <Video className="mr-2 h-4 w-4" />
                {googleError ? "Connect Google (required for Meet links)" : "Connect Google to generate Meet links"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button type="button" variant="outline" onClick={generateMeet} className="w-full">
                  <Video className="mr-2 h-4 w-4" /> Generate Google Meet Link
                </Button>
                {meetLink && (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">Meet link (will be sent to tagged members):</p>
                    <a href={meetLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                      {meetLink}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editingId ? "Save Changes" : "Add Meeting"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); toast({ title: "Meeting deleted" }); setDeleteId(null); } }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CalendarView;
