import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Settings, Award, Pencil, Trash2, Search, Coins } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type StaffMember = { id: string; name: string; email: string; role: "admin" | "staff"; permissions: any[]; credits: number; points: number; joinedAt?: string; };

const ALL_MODULES = ["leads", "tasks", "projects", "calendar", "assets", "social_media", "seo", "reports", "credits"];
type Draft = { id?: string; name: string; email: string; password?: string; role: "admin" | "staff"; credits: number; points: number; };
const emptyDraft: Draft = { name: "", email: "", password: "", role: "staff", credits: 0, points: 0 };

const StaffManagement = () => {
  const qc = useQueryClient();
  const { data: rawUsers = [] } = useQuery({ queryKey: ["users"], queryFn: () => api.get<any[]>("/auth/users") });

  const staff: StaffMember[] = (rawUsers as any[]).filter((u: any) => u.role !== "user").map((u: any) => ({
    id: String(u.id), name: u.name, email: u.email, role: u.role,
    permissions: (u.permissions || []).filter((p: any) => p.has_access).map((p: any) => p.module),
    credits: u.credits || 0, points: u.points || 0,
  }));

  const registerMutation = useMutation({
    mutationFn: (payload: any) => api.post("/auth/register", payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast({ title: "Staff added" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.put(`/auth/users/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast({ title: "Staff updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const permMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: Record<string, boolean> }) =>
      api.put(`/auth/users/${id}/permissions`, { permissions }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast({ title: "Permissions saved" }); setEditingStaff(null); },
  });
  const creditMutation = useMutation({
    mutationFn: ({ id, delta, reason }: { id: string; delta: number; reason: string }) =>
      api.put(`/auth/users/${id}`, { credits_delta: delta, points_delta: delta, credit_reason: reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); },
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "staff">("all");
  const [profileOpen, setProfileOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [localPerms, setLocalPerms] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creditTarget, setCreditTarget] = useState<StaffMember | null>(null);
  const [creditDelta, setCreditDelta] = useState("");
  const [creditReason, setCreditReason] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return staff.filter((s) => {
      if (roleFilter !== "all" && s.role !== roleFilter) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    });
  }, [staff, search, roleFilter]);

  const openAdd = () => { setDraft(emptyDraft); setProfileOpen(true); };
  const openEdit = (s: StaffMember) => {
    setDraft({ id: s.id, name: s.name, email: s.email, role: s.role, credits: s.credits, points: s.points });
    setProfileOpen(true);
  };

  const saveProfile = () => {
    if (!draft.name.trim() || !draft.email.trim()) {
      toast({ title: "Missing info", description: "Name and email are required.", variant: "destructive" }); return;
    }
    if (draft.id) {
      updateMutation.mutate({ id: draft.id, payload: { name: draft.name, phone: "", is_active: true, role: draft.role } });
    } else {
      if (!draft.password?.trim()) { toast({ title: "Password required", variant: "destructive" }); return; }
      registerMutation.mutate({ name: draft.name, email: draft.email, password: draft.password, role: draft.role });
    }
    setProfileOpen(false);
  };

  const openPermissions = (s: StaffMember) => {
    const perms: Record<string, boolean> = {};
    ALL_MODULES.forEach((m) => { perms[m] = s.permissions.includes(m) || s.permissions.includes("all"); });
    setLocalPerms(perms);
    setEditingStaff(s);
  };

  const deleteStaff = () => {
    if (!deletingId) return;
    updateMutation.mutate({ id: deletingId, payload: { is_active: false } });
    setDeletingId(null);
  };

  const applyCreditAdjust = () => {
    const delta = Number(creditDelta);
    if (!creditTarget || Number.isNaN(delta) || delta === 0) {
      toast({ title: "Enter a value", variant: "destructive" }); return;
    }
    creditMutation.mutate({ id: creditTarget.id, delta, reason: creditReason });
    toast({ title: delta > 0 ? "Credits added" : "Credits deducted", description: `${delta > 0 ? "+" : ""}${delta} for ${creditTarget.name}` });
    setCreditTarget(null); setCreditDelta(""); setCreditReason("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage team members, roles and module permissions</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v: typeof roleFilter) => setRoleFilter(v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total members</p><p className="text-2xl font-bold">{staff.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Admins</p><p className="text-2xl font-bold">{staff.filter(s => s.role === "admin").length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Staff</p><p className="text-2xl font-bold">{staff.filter(s => s.role === "staff").length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total credits</p><p className="text-2xl font-bold">{staff.reduce((sum, s) => sum + s.credits, 0)}</p></CardContent></Card>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No staff match your filters.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                    <Badge variant={member.role === "admin" ? "default" : "secondary"} className="mt-1 capitalize">
                      {member.role}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>{member.points} pts</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Coins className="h-4 w-4" />
                    <span>{member.credits} credits</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {member.permissions.includes("all") ? (
                    <Badge variant="outline" className="text-xs">All modules</Badge>
                  ) : (
                    <>
                      {member.permissions.slice(0, 4).map((p) => (
                        <Badge key={p} variant="outline" className="text-xs capitalize">{p.replace("_", " ")}</Badge>
                      ))}
                      {member.permissions.length > 4 && (
                        <Badge variant="outline" className="text-xs">+{member.permissions.length - 4}</Badge>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(member)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openPermissions(member)}>
                    <Settings className="mr-1 h-3.5 w-3.5" /> Permissions
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setCreditTarget(member); setCreditDelta(""); setCreditReason(""); }}>
                    <Coins className="mr-1 h-3.5 w-3.5" /> Credits
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingId(member.id)}
                    disabled={member.role === "admin" && staff.filter(s => s.role === "admin").length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit profile */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit staff" : "Add staff"}</DialogTitle>
            <DialogDescription>
              {draft.id ? "Update profile information." : "Create a new team member account."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="jane@crm.com" />
            </div>
            {!draft.id && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={draft.password || ""} onChange={(e) => setDraft({ ...draft, password: e.target.value })} placeholder="Min 8 characters" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={draft.role} onValueChange={(v: "admin" | "staff") => setDraft({ ...draft, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="credits">Credits</Label>
                <Input id="credits" type="number" value={draft.credits} onChange={(e) => setDraft({ ...draft, credits: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="points">Points</Label>
                <Input id="points" type="number" value={draft.points} onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
            <Button onClick={saveProfile}>{draft.id ? "Save changes" : "Add staff"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions */}
      <Dialog open={!!editingStaff} onOpenChange={() => setEditingStaff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permissions — {editingStaff?.name}</DialogTitle>
            <DialogDescription>Toggle module access for this team member.</DialogDescription>
          </DialogHeader>
          {editingStaff && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {editingStaff.role === "admin" && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Admins automatically have access to all modules.
                </p>
              )}
            {ALL_MODULES.map((mod) => {
                const checked = !!localPerms[mod];
                return (
                  <div key={mod} className="flex items-center justify-between rounded-md border border-border p-2.5">
                    <Label className="capitalize">{mod.replace("_", " ")}</Label>
                    <Switch checked={checked} onCheckedChange={(v) => setLocalPerms((p) => ({ ...p, [mod]: v }))} />
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => editingStaff && permMutation.mutate({ id: editingStaff.id, permissions: localPerms })} disabled={permMutation.isPending}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit adjust */}
      <Dialog open={!!creditTarget} onOpenChange={() => setCreditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust credits — {creditTarget?.name}</DialogTitle>
            <DialogDescription>
              Current: <strong>{creditTarget?.credits}</strong> credits / <strong>{creditTarget?.points}</strong> points.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Amount (use negative to deduct)</Label>
              <Input type="number" placeholder="e.g. 5 or -3" value={creditDelta} onChange={(e) => setCreditDelta(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Input placeholder="e.g. Bonus for great work" value={creditReason} onChange={(e) => setCreditReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditTarget(null)}>Cancel</Button>
            <Button onClick={applyCreditAdjust}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this staff member?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The member will lose access to the CRM.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteStaff} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffManagement;
