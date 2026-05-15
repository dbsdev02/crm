import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Filter, Download, Plus } from "lucide-react";
import { UserTable, AdminUser } from "@/components/admin/UserTable";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const roles   = ["All Roles", "super_admin", "admin", "staff", "user"];
const statuses = ["All Status", "active", "suspended"];

export default function AdminUsers() {
  const [search, setSearch]   = useState("");
  const [role, setRole]       = useState("All Roles");
  const [status, setStatus]   = useState("All Status");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: rawUsers = [], isLoading } = useQuery({
    queryKey: ["admin-users", search, role, status],
    queryFn: () => api.get<any[]>(`/admin/users?search=${search}&role=${role === "All Roles" ? "" : role}&status=${status === "All Status" ? "" : status === "active" ? "active" : "suspended"}`),
  });

  // Map backend shape → AdminUser shape
  const users: AdminUser[] = rawUsers.map((u: any) => ({
    id:      u.id,
    name:    u.name,
    email:   u.email,
    role:    u.role,
    plan:    "—",
    status:  u.is_active ? "active" : "suspended",
    joined:  new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    tasks:   u.tasks ?? 0,
  }));

  const suspendMutation = useMutation({
    mutationFn: (id: number) => api.put(`/admin/users/${id}/suspend`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: "User status updated" }); },
  });

  const resetMutation = useMutation({
    mutationFn: (id: number) => api.post<any>(`/admin/users/${id}/reset-password`, {}),
    onSuccess: (data) => toast({ title: "Password reset", description: `Temp password: ${data.tempPassword}` }),
  });

  const handleAction = (action: string, user: AdminUser) => {
    if (action === "suspend") suspendMutation.mutate(user.id);
    else if (action === "reset") resetMutation.mutate(user.id);
    else if (action === "impersonate") toast({ title: `Impersonating ${user.name}…` });
    else if (action === "role") toast({ title: `Use the role editor for ${user.name}` });
  };

  const counts = {
    total:     users.length,
    active:    users.filter(u => u.status === "active").length,
    suspended: users.filter(u => u.status === "suspended").length,
    pending:   0,
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Users",  value: counts.total },
          { label: "Active",       value: counts.active },
          { label: "Suspended",    value: counts.suspended },
          { label: "Roles",        value: [...new Set(users.map(u => u.role))].length },
        ].map(({ label, value }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-[#f0f0f0] px-4 py-3 shadow-sm">
            <p className="text-[11px] text-[#888] uppercase tracking-wider">{label}</p>
            <p className="text-[22px] font-semibold text-[#0f0f0f] mt-1">{isLoading ? "—" : value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[#f0f0f0]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#aaa]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
              className="w-full h-8 pl-8 pr-3 text-[13px] bg-[#f5f5f5] rounded-lg border border-transparent focus:outline-none focus:border-[#e0e0e0] focus:bg-white transition-all placeholder:text-[#bbb]" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-[#aaa]" />
            {[
              { value: role,   onChange: setRole,   options: roles },
              { value: status, onChange: setStatus, options: statuses },
            ].map(({ value, onChange, options }, i) => (
              <select key={i} value={value} onChange={e => onChange(e.target.value)}
                className="h-8 px-2.5 text-[12px] bg-[#f5f5f5] rounded-lg border border-transparent focus:outline-none text-[#555] cursor-pointer">
                {options.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-[#555] bg-[#f5f5f5] rounded-lg hover:bg-[#ebebeb] transition-colors">
              <Download className="size-3.5" /> Export
            </button>
            <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-white bg-[#0f0f0f] rounded-lg hover:bg-[#333] transition-colors">
              <Plus className="size-3.5" /> Invite User
            </button>
          </div>
        </div>
        {isLoading
          ? <div className="p-5 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          : <UserTable users={users} onAction={handleAction} />
        }
        <div className="px-5 py-3 border-t border-[#f5f5f5]">
          <span className="text-[12px] text-[#888]">Showing {users.length} users</span>
        </div>
      </motion.div>
    </div>
  );
}
