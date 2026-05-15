import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  { id: 1, name: "Super Admin", color: "text-[#db4035] bg-[#fef2f2]",   desc: "Full system access. Cannot be restricted." },
  { id: 2, name: "Admin",       color: "text-purple-600 bg-purple-50",  desc: "Manages workspace, users and billing." },
  { id: 3, name: "Manager",     color: "text-blue-600 bg-blue-50",      desc: "Manages team members and projects." },
  { id: 4, name: "Member",      color: "text-gray-600 bg-gray-100",     desc: "Standard access to tasks and projects." },
  { id: 5, name: "Viewer",      color: "text-gray-400 bg-gray-50",      desc: "Read-only access to assigned content." },
];

const permissions = [
  "Create Projects",
  "Delete Projects",
  "Manage Automations",
  "Access Billing",
  "Delete Workspaces",
  "Manage Users",
  "View Reports",
  "Export Data",
  "Manage Integrations",
  "Configure AI Settings",
];

// true = allowed, false = denied, null = not applicable
const matrix: Record<string, Record<string, boolean | null>> = {
  "Super Admin": Object.fromEntries(permissions.map(p => [p, true])),
  "Admin":       { "Create Projects": true, "Delete Projects": true, "Manage Automations": true, "Access Billing": true, "Delete Workspaces": true, "Manage Users": true, "View Reports": true, "Export Data": true, "Manage Integrations": true, "Configure AI Settings": false },
  "Manager":     { "Create Projects": true, "Delete Projects": false, "Manage Automations": true, "Access Billing": false, "Delete Workspaces": false, "Manage Users": false, "View Reports": true, "Export Data": true, "Manage Integrations": false, "Configure AI Settings": false },
  "Member":      { "Create Projects": true, "Delete Projects": false, "Manage Automations": false, "Access Billing": false, "Delete Workspaces": false, "Manage Users": false, "View Reports": false, "Export Data": false, "Manage Integrations": false, "Configure AI Settings": false },
  "Viewer":      Object.fromEntries(permissions.map(p => [p, false])),
};

export default function AdminRoles() {
  const [selected, setSelected] = useState("Admin");
  const perms = matrix[selected] ?? {};

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Role list */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-semibold text-[#0f0f0f]">Roles</h3>
            <button className="flex items-center gap-1 text-[12px] text-[#555] hover:text-[#0f0f0f] transition-colors">
              <Plus className="size-3.5" /> New Role
            </button>
          </div>
          {roles.map((role) => (
            <button key={role.id} onClick={() => setSelected(role.name)}
              className={cn(
                "w-full text-left p-3 rounded-xl border transition-all",
                selected === role.name ? "border-[#0f0f0f] bg-[#fafafa]" : "border-transparent hover:bg-[#fafafa]"
              )}>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="size-3.5 text-[#aaa]" />
                <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", role.color)}>{role.name}</span>
              </div>
              <p className="text-[12px] text-[#888] pl-5">{role.desc}</p>
            </button>
          ))}
        </motion.div>

        {/* Permission matrix */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-[#f0f0f0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-[#0f0f0f]">Permissions — {selected}</h3>
              <p className="text-[12px] text-[#888] mt-0.5">{roles.find(r => r.name === selected)?.desc}</p>
            </div>
            {selected !== "Super Admin" && (
              <button className="h-8 px-3 text-[12px] text-white bg-[#0f0f0f] rounded-lg hover:bg-[#333] transition-colors">
                Save Changes
              </button>
            )}
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-2">
            {permissions.map((perm, i) => {
              const allowed = perms[perm];
              const locked = selected === "Super Admin";
              return (
                <motion.div key={perm} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-colors",
                    allowed ? "border-emerald-100 bg-emerald-50/50" : "border-[#f0f0f0] bg-[#fafafa]"
                  )}>
                  <span className="text-[13px] text-[#333]">{perm}</span>
                  <button disabled={locked}
                    className={cn(
                      "size-6 rounded-full grid place-items-center transition-colors",
                      allowed ? "bg-emerald-500 text-white" : "bg-[#e8e8e8] text-[#aaa]",
                      locked && "opacity-60 cursor-not-allowed"
                    )}>
                    {allowed ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
