import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Building2, Bell, Award, Megaphone, Shield, ListPlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Announcement } from "@/data/mockData";
import { useLeadFields, FieldType } from "@/contexts/LeadFieldsContext";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  // Company
  const [company, setCompany] = useState({
    name: "Acme CRM",
    email: "hello@acmecrm.com",
    phone: "+1-555-0100",
    address: "123 Market Street, San Francisco, CA",
    timezone: "America/Los_Angeles",
    currency: "USD",
  });

  // Notifications
  const [notif, setNotif] = useState({
    emailLeads: true,
    emailTasks: true,
    desktopAlerts: true,
    weeklyReport: false,
    soundEnabled: true,
  });

  // Credits rules
  const [credits, setCredits] = useState({
    early: 2,
    onTime: 1,
    late: -1,
    leadOnboarded: 5,
    minComment: 10,
  });

  // Announcements
  const qc = useQueryClient();
  const { data: rawAnn = [] } = useQuery({ queryKey: ["announcements"], queryFn: () => api.get<any[]>("/announcements") });
  const announcements: Announcement[] = (rawAnn as any[]).map((a) => ({
    id: String(a.id), message: a.message, active: a.is_active, createdAt: a.created_at?.split("T")[0] || "",
  }));
  const addAnnMutation = useMutation({
    mutationFn: (message: string) => api.post("/announcements", { message }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
  const deleteAnnMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
  const [newAnn, setNewAnn] = useState("");

  // Security
  const [security, setSecurity] = useState({
    sessionTimeout: 60,
    twoFactor: false,
    passwordMinLen: 8,
    auditLog: true,
  });

  // Lead fields customization
  const { builtIn, custom, toggleBuiltIn, toggleBuiltInRequired, addCustom, removeCustom } = useLeadFields();
  const [newField, setNewField] = useState<{ label: string; type: FieldType; required: boolean; options: string }>({
    label: "", type: "text", required: false, options: "",
  });

  const handleAddField = () => {
    if (!newField.label.trim()) {
      toast({ title: "Field label required", variant: "destructive" });
      return;
    }
    const opts = newField.type === "select"
      ? newField.options.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    if (newField.type === "select" && (!opts || opts.length === 0)) {
      toast({ title: "Add at least one option for the dropdown", variant: "destructive" });
      return;
    }
    addCustom({ label: newField.label.trim(), type: newField.type, required: newField.required, options: opts });
    setNewField({ label: "", type: "text", required: false, options: "" });
    toast({ title: "Custom field added" });
  };

  const saveCompany = () => toast({ title: "Company info saved" });
  const saveNotif = () => toast({ title: "Notification preferences saved" });
  const saveCredits = () => toast({ title: "Credit rules updated" });
  const saveSecurity = () => toast({ title: "Security settings saved" });

  const addAnnouncement = () => {
    if (!newAnn.trim()) {
      toast({ title: "Empty message", description: "Write something to announce.", variant: "destructive" });
      return;
    }
    addAnnMutation.mutate(newAnn.trim());
    setNewAnn("");
    toast({ title: "Announcement published" });
  };
  const toggleAnn = (_id: string) => toast({ title: "Toggle not supported via API yet" });
  const removeAnn = (id: string) => {
    deleteAnnMutation.mutate(id);
    toast({ title: "Announcement removed" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">System configuration and preferences</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full md:w-auto">
          <TabsTrigger value="company"><Building2 className="h-4 w-4 mr-1.5" />Company</TabsTrigger>
          <TabsTrigger value="leadfields"><ListPlus className="h-4 w-4 mr-1.5" />Lead Fields</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1.5" />Notifications</TabsTrigger>
          <TabsTrigger value="credits"><Award className="h-4 w-4 mr-1.5" />Credits</TabsTrigger>
          <TabsTrigger value="announcements"><Megaphone className="h-4 w-4 mr-1.5" />Announcements</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-1.5" />Security</TabsTrigger>
        </TabsList>

        {/* COMPANY */}
        <TabsContent value="company" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Company information</CardTitle>
              <CardDescription>Used across invoices, emails and reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Company name</Label>
                  <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact email</Label>
                  <Input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Select value={company.timezone} onValueChange={(v) => setCompany({ ...company, timezone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={company.currency} onValueChange={(v) => setCompany({ ...company, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Textarea rows={2} value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
              </div>
              <div className="flex justify-end">
                <Button onClick={saveCompany}><Save className="mr-2 h-4 w-4" />Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEAD FIELDS */}
        <TabsContent value="leadfields" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Built-in lead fields</CardTitle>
              <CardDescription>Toggle which standard fields show on the Add/Edit Lead form, and whether they're required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {builtIn.map((f) => (
                <div key={f.key} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{f.label}</p>
                    {f.locked && <p className="text-xs text-muted-foreground">Always visible — required by system</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Required</Label>
                      <Switch
                        checked={f.required}
                        disabled={f.locked}
                        onCheckedChange={() => toggleBuiltInRequired(f.key)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Show</Label>
                      <Switch
                        checked={f.enabled}
                        disabled={f.locked}
                        onCheckedChange={() => toggleBuiltIn(f.key)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom lead fields</CardTitle>
              <CardDescription>Add your own fields. They appear on the Add/Edit Lead form and lead details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-12 gap-2 items-end">
                <div className="md:col-span-4 space-y-1.5">
                  <Label>Field label</Label>
                  <Input
                    placeholder="e.g. Industry"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  />
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <Label>Type</Label>
                  <Select value={newField.type} onValueChange={(v) => setNewField({ ...newField, type: v as FieldType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="tel">Phone</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="select">Dropdown</SelectItem>
                      <SelectItem value="textarea">Long text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <Label>Options (comma separated)</Label>
                  <Input
                    placeholder="Tech, Retail, Healthcare"
                    disabled={newField.type !== "select"}
                    value={newField.options}
                    onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                  />
                </div>
                <div className="md:col-span-1 flex items-center gap-2">
                  <Switch checked={newField.required} onCheckedChange={(v) => setNewField({ ...newField, required: v })} />
                  <Label className="text-xs">Req.</Label>
                </div>
                <div className="md:col-span-1">
                  <Button onClick={handleAddField} className="w-full"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>

              <Separator />

              {custom.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No custom fields yet.</p>
              ) : (
                <div className="space-y-2">
                  {custom.map((cf) => (
                    <div key={cf.id} className="flex items-center justify-between rounded-md border border-border p-3">
                      <div>
                        <p className="text-sm font-medium">{cf.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Type: {cf.type}{cf.required ? " • Required" : ""}
                          {cf.options?.length ? ` • Options: ${cf.options.join(", ")}` : ""}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeCustom(cf.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>Decide how the system reaches you and your team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "emailLeads", label: "Email me when a new lead is added" },
                { key: "emailTasks", label: "Email me on new task assignments" },
                { key: "desktopAlerts", label: "Show desktop alerts" },
                { key: "weeklyReport", label: "Send weekly performance report" },
                { key: "soundEnabled", label: "Play sound on important events" },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between rounded-md border border-border p-3">
                  <Label>{n.label}</Label>
                  <Switch
                    checked={(notif as Record<string, boolean>)[n.key]}
                    onCheckedChange={(v) => setNotif({ ...notif, [n.key]: v })}
                  />
                </div>
              ))}
              <div className="flex justify-end">
                <Button onClick={saveNotif}><Save className="mr-2 h-4 w-4" />Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CREDITS */}
        <TabsContent value="credits" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit & points rules</CardTitle>
              <CardDescription>Configure how performance credits are awarded.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Task completed early</Label>
                  <Input type="number" value={credits.early} onChange={(e) => setCredits({ ...credits, early: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Task completed on time</Label>
                  <Input type="number" value={credits.onTime} onChange={(e) => setCredits({ ...credits, onTime: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Task completed late</Label>
                  <Input type="number" value={credits.late} onChange={(e) => setCredits({ ...credits, late: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Lead onboarded bonus</Label>
                  <Input type="number" value={credits.leadOnboarded} onChange={(e) => setCredits({ ...credits, leadOnboarded: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Min comment length (chars)</Label>
                  <Input type="number" value={credits.minComment} onChange={(e) => setCredits({ ...credits, minComment: Number(e.target.value) })} />
                </div>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Use negative numbers for deductions. Changes apply to future actions only.
              </p>
              <div className="flex justify-end">
                <Button onClick={saveCredits}><Save className="mr-2 h-4 w-4" />Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANNOUNCEMENTS */}
        <TabsContent value="announcements" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Announcements banner</CardTitle>
              <CardDescription>Active announcements scroll in the top header for all users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newAnn}
                  onChange={(e) => setNewAnn(e.target.value)}
                  placeholder="📣 Internal meeting tomorrow at 10 AM"
                  onKeyDown={(e) => e.key === "Enter" && addAnnouncement()}
                />
                <Button onClick={addAnnouncement}><Plus className="mr-2 h-4 w-4" />Add</Button>
              </div>
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No announcements yet.</p>
              ) : (
                <div className="space-y-2">
                  {announcements.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{a.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={a.active ? "default" : "outline"} className="text-xs">
                            {a.active ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{a.createdAt}</span>
                        </div>
                      </div>
                      <Switch checked={a.active} onCheckedChange={() => toggleAnn(a.id)} />
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeAnn(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security & access</CardTitle>
              <CardDescription>Control session and authentication policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Session timeout (minutes)</Label>
                  <Input type="number" value={security.sessionTimeout} onChange={(e) => setSecurity({ ...security, sessionTimeout: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Minimum password length</Label>
                  <Input type="number" value={security.passwordMinLen} onChange={(e) => setSecurity({ ...security, passwordMinLen: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <Label>Two-factor authentication</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Require 2FA for all admin accounts.</p>
                </div>
                <Switch checked={security.twoFactor} onCheckedChange={(v) => setSecurity({ ...security, twoFactor: v })} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <Label>Activity audit log</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Record every privileged action.</p>
                </div>
                <Switch checked={security.auditLog} onCheckedChange={(v) => setSecurity({ ...security, auditLog: v })} />
              </div>
              <div className="flex justify-end">
                <Button onClick={saveSecurity}><Save className="mr-2 h-4 w-4" />Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
