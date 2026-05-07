import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECT_COLORS } from "@/hooks/useProjects";
import { useCustomers } from "@/contexts/CustomersContext";

const STATUSES = [
  { value: "active",    label: "Active" },
  { value: "planning",  label: "Planning" },
  { value: "on_hold",   label: "On Hold" },
  { value: "completed", label: "Completed" },
];

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: any) => void;
  editProject?: any;
}

const empty = () => ({
  name: "", description: "", color: "#4073ff",
  status: "active", clientName: "", progress: "0",
});

export function ProjectFormModal({ open, onOpenChange, onSave, editProject }: ProjectFormModalProps) {
  const [form, setForm] = useState(empty());
  const { customers } = useCustomers();

  useEffect(() => {
    if (editProject) {
      setForm({
        name: editProject.name || "",
        description: editProject.description || "",
        color: editProject.color || "#4073ff",
        status: editProject.status || "active",
        clientName: editProject.clientName || "",
        progress: String(editProject.progress || 0),
      });
    } else {
      setForm(empty());
    }
  }, [open, editProject]);

  const handleSave = () => {
    if (!form.name.trim()) return;
    const statusToApi: Record<string, string> = {
      active: "in_progress", on_hold: "on_hold",
      completed: "completed", planning: "planning",
    };
    const client = customers.find((c) => c.name === form.clientName);
    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color,
      status: statusToApi[form.status] ?? form.status,
      progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
      client_name: form.clientName,
      client_email: client?.email || "",
      client_phone: client?.phone || "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-[#e5e5e5] shadow-xl p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#f0f0f0]">
          <DialogTitle className="text-[16px] font-semibold text-[#202020]">
            {editProject ? "Edit project" : "New project"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-3">
          {/* Name */}
          <div>
            <label className="text-[12px] text-[#777] mb-1 block">Name *</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Project name"
              className="w-full text-[14px] text-[#202020] border border-[#e5e5e5] rounded-xl px-3 py-2 outline-none focus:border-[#db4035] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] text-[#777] mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
              rows={2}
              className="w-full text-[13px] text-[#555] border border-[#e5e5e5] rounded-xl px-3 py-2 outline-none focus:border-[#db4035] resize-none transition-colors"
            />
          </div>

          {/* Color + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-[#777] mb-1 block">Color</label>
              <div className="flex flex-wrap gap-2 p-2 border border-[#e5e5e5] rounded-xl">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setForm({ ...form, color: c.value })}
                    className={cn(
                      "h-5 w-5 rounded-full transition-all",
                      form.color === c.value && "ring-2 ring-offset-1 ring-[#202020]"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] text-[#777] mb-1 block">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-9 text-[13px] border-[#e5e5e5] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client */}
          <div>
            <label className="text-[12px] text-[#777] mb-1 block">Client</label>
            <Select value={form.clientName || "none"} onValueChange={(v) => setForm({ ...form, clientName: v === "none" ? "" : v })}>
              <SelectTrigger className="h-9 text-[13px] border-[#e5e5e5] rounded-xl">
                <SelectValue placeholder="No client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}{c.company ? ` — ${c.company}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progress */}
          <div>
            <label className="text-[12px] text-[#777] mb-1 block">Progress ({form.progress}%)</label>
            <input
              type="range" min={0} max={100}
              value={form.progress}
              onChange={(e) => setForm({ ...form, progress: e.target.value })}
              className="w-full accent-[#db4035]"
            />
          </div>
        </div>

        <DialogFooter className="px-5 pb-5 pt-2 border-t border-[#f0f0f0] flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-[#e5e5e5] text-[13px]">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="rounded-xl bg-[#db4035] hover:bg-[#c0392b] text-white text-[13px]"
          >
            {editProject ? "Save changes" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
