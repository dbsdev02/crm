import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  MessageSquare,
  GripVertical,
  Building,
  Mail,
  Phone,
  DollarSign,
  Pencil,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LEAD_STAGES, Lead, LeadStage } from "@/data/mockData";
import { useLeadFields } from "@/contexts/LeadFieldsContext";

type LeadForm = {
  name: string;
  company: string;
  email: string;
  phone: string;
  value: string;
  stage: LeadStage;
  custom: Record<string, string>;
};

const emptyForm: LeadForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  value: "",
  stage: "contacted",
  custom: {},
};

const stageToApi: Record<LeadStage, string> = {
  contacted: "lead_contacted", interested: "interested", meeting: "first_meet_confirmed",
  followup: "followups", negotiation: "negotiations", uninterested: "uninterested", onboarded: "onboarded",
};
const stageFromApi: Record<string, LeadStage> = {
  lead_contacted: "contacted", interested: "interested", first_meet_confirmed: "meeting",
  followups: "followup", negotiations: "negotiation", uninterested: "uninterested", onboarded: "onboarded",
};

const Leads = () => {
  const { builtIn, custom: customFields } = useLeadFields();
  const qc = useQueryClient();
  const { data: rawLeads = [] } = useQuery({ queryKey: ["leads"], queryFn: () => api.get<any[]>("/leads") });
  const leads: Lead[] = rawLeads.map((l: any) => ({
    id: String(l.id), name: l.name, company: l.company || "", email: l.email || "",
    phone: l.phone || "", stage: stageFromApi[l.stage] || "contacted",
    assignedTo: String(l.assigned_to || ""), value: Number(l.value) || 0,
    comments: [], createdAt: l.created_at?.split("T")[0] || "", custom: l.custom_fields ? JSON.parse(l.custom_fields) : {},
  }));
  const [commentModal, setCommentModal] = useState<{ lead: Lead; newStage: LeadStage } | null>(null);
  const [comment, setComment] = useState("");
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const isFieldEnabled = (key: string) =>
    builtIn.find((b) => b.key === key)?.enabled ?? true;
  const isFieldRequired = (key: string) =>
    builtIn.find((b) => b.key === key)?.required ?? false;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setEditorOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setForm({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      value: String(lead.value),
      stage: lead.stage,
      custom: { ...(lead.custom ?? {}) },
    });
    setDetailLead(null);
    setEditorOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: any) => editingId
      ? api.put(`/leads/${editingId}`, payload)
      : api.post("/leads", payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); toast({ title: editingId ? "Lead updated" : "Lead added" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); toast({ title: "Lead deleted" }); },
  });
  const stageMutation = useMutation({
    mutationFn: ({ id, stage, comment }: { id: string; stage: string; comment: string }) =>
      api.put(`/leads/${id}/stage`, { stage, comment }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveLead = () => {
    for (const f of builtIn) {
      if (!f.enabled || !f.required) continue;
      const val = (form as unknown as Record<string, unknown>)[f.key];
      if (typeof val === "string" && !val.trim()) {
        toast({ title: "Missing info", description: `${f.label} is required.`, variant: "destructive" }); return;
      }
    }
    for (const cf of customFields) {
      if (cf.required && !(form.custom[cf.key] ?? "").toString().trim()) {
        toast({ title: "Missing info", description: `${cf.label} is required.`, variant: "destructive" }); return;
      }
    }
    saveMutation.mutate({
      name: form.name, company: form.company, email: form.email, phone: form.phone,
      value: Number(form.value) || 0, stage: stageToApi[form.stage],
      custom_fields: JSON.stringify(form.custom),
    });
    setEditorOpen(false); setForm(emptyForm); setEditingId(null);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
    setDeleteId(null); setDetailLead(null);
  };

  const handleDragStart = (lead: Lead) => setDraggedLead(lead);

  const handleDrop = (stage: LeadStage) => {
    if (!draggedLead || draggedLead.stage === stage) {
      setDraggedLead(null);
      return;
    }
    setCommentModal({ lead: draggedLead, newStage: stage });
    setDraggedLead(null);
  };

  const handleStageChange = () => {
    if (!commentModal || !comment.trim()) {
      toast({ title: "Comment required", description: "You must add a comment when changing lead stage.", variant: "destructive" }); return;
    }
    stageMutation.mutate({ id: commentModal.lead.id, stage: stageToApi[commentModal.newStage], comment });
    toast({ title: "Lead updated", description: `${commentModal.lead.name} moved to ${LEAD_STAGES.find((s) => s.key === commentModal.newStage)?.label}` });
    setComment(""); setCommentModal(null);
  };

  const stageColorMap: Record<LeadStage, string> = {
    contacted: "bg-lead-contacted",
    interested: "bg-lead-interested",
    meeting: "bg-lead-meeting",
    followup: "bg-lead-followup",
    negotiation: "bg-lead-negotiation",
    uninterested: "bg-lead-uninterested",
    onboarded: "bg-lead-onboarded",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Management</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Lead
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {LEAD_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.key);
          return (
            <div
              key={stage.key}
              className="min-w-[280px] flex-shrink-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage.key)}
            >
              <div className="rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2 p-3 border-b border-border">
                  <div className={`h-3 w-3 rounded-full ${stageColorMap[stage.key]}`} />
                  <span className="text-sm font-medium">{stage.label}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">{stageLeads.length}</Badge>
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {stageLeads.map((lead) => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead)}
                      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                      onClick={() => setDetailLead(lead)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.company}</p>
                          </div>
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {lead.value.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {lead.comments.length}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory Comment Modal */}
      <Dialog open={!!commentModal} onOpenChange={() => { setCommentModal(null); setComment(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stage Change Comment (Required)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Moving <strong>{commentModal?.lead.name}</strong> to{" "}
              <strong>{LEAD_STAGES.find((s) => s.key === commentModal?.newStage)?.label}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment *</Label>
              <Textarea
                id="comment"
                placeholder="Add a comment about this stage change..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCommentModal(null); setComment(""); }}>Cancel</Button>
            <Button onClick={handleStageChange} disabled={!comment.trim()}>Save Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Modal */}
      <Dialog open={!!detailLead} onOpenChange={(o) => !o && setDetailLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailLead?.name}</DialogTitle>
          </DialogHeader>
          {detailLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" />{detailLead.company}</div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{detailLead.email}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{detailLead.phone}</div>
                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" />${detailLead.value.toLocaleString()}</div>
              </div>
              {customFields.length > 0 && detailLead.custom && (
                <div className="grid grid-cols-2 gap-3 text-sm rounded-md border border-border p-3 bg-muted/30">
                  {customFields.map((cf) => (
                    <div key={cf.id}>
                      <p className="text-xs text-muted-foreground">{cf.label}</p>
                      <p className="font-medium">{detailLead.custom?.[cf.key] || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium mb-2">Comment History</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {detailLead.comments.map((c, i) => (
                    <div key={i} className="rounded-lg bg-muted p-3 text-sm">
                      <p>{c.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{c.author} • {c.date} • <span className="capitalize">{c.stage}</span></p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => openEdit(detailLead)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteId(detailLead.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit Lead Modal */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto px-[3px] py-[3px]">
            <div className="grid grid-cols-2 gap-3">
              {builtIn.filter((f) => f.enabled).map((f) => {
                const star = f.required ? " *" : "";
                if (f.key === "stage") {
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <Label>{f.label}{star}</Label>
                      <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as LeadStage })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {LEAD_STAGES.map((s) => (
                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                const inputType = f.key === "email" ? "email" : f.key === "value" ? "number" : f.key === "phone" ? "tel" : "text";
                const placeholders: Record<string, string> = {
                  name: "e.g. Rahul Sharma",
                  email: "e.g. rahul@example.com",
                  phone: "e.g. +91 98765 43210",
                  company: "e.g. Tata Consultancy",
                  value: "e.g. 50000",
                };
                return (
                  <div key={f.key} className="space-y-1.5">
                    <Label htmlFor={`lead-${f.key}`}>{f.label}{star}</Label>
                    <Input
                      id={`lead-${f.key}`}
                      type={inputType}
                      inputMode={f.key === "phone" ? "numeric" : undefined}
                      placeholder={placeholders[f.key] ?? ""}
                      value={(form as unknown as Record<string, string>)[f.key] ?? ""}
                      onChange={(e) => {
                        const val = f.key === "phone" ? e.target.value.replace(/[^0-9+\s\-()]/g, "") : e.target.value;
                        setForm({ ...form, [f.key]: val });
                      }}
                    />
                  </div>
                );
              })}

              {customFields.map((cf) => {
                const val = form.custom[cf.key] ?? "";
                const star = cf.required ? " *" : "";
                const setVal = (v: string) =>
                  setForm({ ...form, custom: { ...form.custom, [cf.key]: v } });
                if (cf.type === "select") {
                  return (
                    <div key={cf.id} className="space-y-1.5">
                      <Label>{cf.label}{star}</Label>
                      <Select value={val} onValueChange={setVal}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {(cf.options ?? []).map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                if (cf.type === "textarea") {
                  return (
                    <div key={cf.id} className="space-y-1.5 col-span-2">
                      <Label>{cf.label}{star}</Label>
                      <Textarea value={val} onChange={(e) => setVal(e.target.value)} />
                    </div>
                  );
                }
                return (
                  <div key={cf.id} className="space-y-1.5">
                    <Label>{cf.label}{star}</Label>
                    <Input type={cf.type} value={val} onChange={(e) => setVal(e.target.value)} />
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={saveLead}>{editingId ? "Save Changes" : "Add Lead"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
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

export default Leads;
