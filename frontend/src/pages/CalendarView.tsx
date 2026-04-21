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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Video } from "lucide-react";
import { api } from "@/lib/api";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  attendees: string[];
}

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

type Form = { title: string; date: string; time: string; attendees: string };
const empty: Form = { title: "", date: "", time: "10:00", attendees: "" };

const CalendarView = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: rawMeetings = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => api.get<any[]>("/meetings"),
  });

  const meetings: Meeting[] = (rawMeetings as any[]).map((m) => ({
    id: String(m.id),
    title: m.title,
    date: m.meeting_date?.split("T")[0] || "",
    time: m.meeting_date
      ? new Date(m.meeting_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
      : "",
    attendees: [],
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
  const [form, setForm] = useState<Form>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState("");

  const { data: googleStatus } = useQuery({
    queryKey: ["google-status"],
    queryFn: () => api.get<{ connected: boolean }>("/google/status"),
  });
  const googleConnected = googleStatus?.connected ?? false;

  const connectGoogle = async () => {
    const { url } = await api.get<{ url: string }>("/google/auth");
    window.open(url, "_blank", "width=600,height=700");
  };

  const generateMeet = async () => {
    if (!googleConnected) {
      toast({ title: "Connect Google first", description: "Click 'Connect Google' button", variant: "destructive" });
      return;
    }
    try {
      const start = new Date(`${form.date}T${form.time}:00`);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour later
      const { meetLink: link } = await api.post<{ meetLink: string }>("/google/create-meet", {
        title: form.title || "CRM Meeting",
        description: "",
        start: start.toISOString(),
        end: end.toISOString(),
        attendees: form.attendees.split(",").map((a) => a.trim()).filter(Boolean),
      });
      setMeetLink(link);
      toast({ title: "Meet link generated", description: link });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const selectedDateStr = date ? toDateStr(date) : "";
  const todayMeetings = useMemo(() => meetings.filter((m) => m.date === selectedDateStr), [meetings, selectedDateStr]);
  const meetingDates = useMemo(() => meetings.map((m) => new Date(m.date + "T00:00:00")), [meetings]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...empty, date: selectedDateStr || toDateStr(new Date()) });
    setMeetLink("");
    setEditorOpen(true);
  };

  const openEdit = (m: Meeting) => {
    setEditingId(m.id);
    setForm({ title: m.title, date: m.date, time: m.time, attendees: m.attendees.join(", ") });
    setMeetLink("");
    setEditorOpen(true);
  };

  const save = () => {
    if (!form.title.trim() || !form.date) {
      toast({ title: "Missing info", description: "Title and date are required.", variant: "destructive" });
      return;
    }
    const meeting_date = `${form.date}T${form.time || "10:00"}:00`;
    saveMutation.mutate({ id: editingId, payload: { title: form.title, meeting_date, participants: [] } });
    toast({ title: editingId ? "Meeting updated" : "Meeting added", description: form.title });
    setEditorOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
    toast({ title: "Meeting deleted" });
    setDeleteId(null);
  };

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
              modifiers={{ hasMeeting: meetingDates }}
              modifiersClassNames={{ hasMeeting: "font-bold text-primary underline underline-offset-4" }}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Meetings — {date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No meetings scheduled for this day.</p>
            ) : (
              <div className="space-y-3">
                {todayMeetings.map((meeting) => (
                  <div key={meeting.id} className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{meeting.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{meeting.time}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(meeting)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(meeting.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">All Meetings</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {meetings.length === 0 && (
              <p className="text-sm text-muted-foreground">No meetings yet. Click "Add Meeting" to create one.</p>
            )}
            {meetings.map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground">{meeting.date} at {meeting.time}</p>
                </div>
                <div className="flex items-center gap-2">
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

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Meeting" : "Add Meeting"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-title">Title *</Label>
              <Input id="m-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-date">Date *</Label>
                <Input id="m-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-time">Time</Label>
                <Input id="m-time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-att">Attendees (comma separated)</Label>
              <Input id="m-att" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} placeholder="john@example.com, emma@example.com" />
            </div>
            {!googleConnected && (
              <Button type="button" variant="outline" onClick={connectGoogle} className="w-full">
                <Video className="mr-2 h-4 w-4" /> Connect Google to generate Meet links
              </Button>
            )}
            {googleConnected && (
              <div className="space-y-2">
                <Button type="button" variant="outline" onClick={generateMeet} className="w-full">
                  <Video className="mr-2 h-4 w-4" /> Generate Google Meet Link
                </Button>
                {meetLink && (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">Meet link:</p>
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
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CalendarView;
