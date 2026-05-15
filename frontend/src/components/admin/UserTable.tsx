import { useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Shield, UserX, KeyRound, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  plan: string;
  status: "active" | "suspended" | "pending";
  joined: string;
  tasks: number;
}

const roleColor: Record<string, string> = {
  "Super Admin": "text-[#db4035] bg-[#fef2f2]",
  "Admin":       "text-purple-600 bg-purple-50",
  "Manager":     "text-blue-600 bg-blue-50",
  "Member":      "text-gray-600 bg-gray-100",
  "Viewer":      "text-gray-500 bg-gray-50",
};

const statusColor: Record<string, string> = {
  active:    "text-emerald-600 bg-emerald-50",
  suspended: "text-red-500 bg-red-50",
  pending:   "text-amber-600 bg-amber-50",
};

const planColor: Record<string, string> = {
  Enterprise:    "text-indigo-600 bg-indigo-50",
  Professional:  "text-blue-600 bg-blue-50",
  Starter:       "text-gray-600 bg-gray-100",
  Free:          "text-gray-400 bg-gray-50",
};

interface UserTableProps {
  users: AdminUser[];
  onAction?: (action: string, user: AdminUser) => void;
}

export function UserTable({ users, onAction }: UserTableProps) {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<keyof AdminUser>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = [...users].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    const cmp = String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (key: keyof AdminUser) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ k }: { k: keyof AdminUser }) => (
    <span className="ml-1 inline-flex flex-col gap-0">
      <ChevronUp className={cn("size-2.5", sortKey === k && sortDir === "asc" ? "text-[#db4035]" : "text-[#ddd]")} />
      <ChevronDown className={cn("size-2.5 -mt-0.5", sortKey === k && sortDir === "desc" ? "text-[#db4035]" : "text-[#ddd]")} />
    </span>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[#f0f0f0]">
            {(["name", "role", "plan", "status", "tasks", "joined"] as (keyof AdminUser)[]).map((k) => (
              <th key={k} onClick={() => toggleSort(k)}
                className="text-left px-4 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider cursor-pointer hover:text-[#555] select-none whitespace-nowrap">
                {k.charAt(0).toUpperCase() + k.slice(1)} <SortIcon k={k} />
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((user, i) => (
            <motion.tr
              key={user.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="border-b border-[#f8f8f8] hover:bg-[#fafafa] transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-full bg-gradient-to-br from-[#db4035] to-[#e8534a] grid place-items-center text-white text-[10px] font-bold shrink-0">
                    {user.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-[#0f0f0f]">{user.name}</p>
                    <p className="text-[11px] text-[#aaa]">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", roleColor[user.role] ?? roleColor.Member)}>
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", planColor[user.plan] ?? planColor.Free)}>
                  {user.plan}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full capitalize", statusColor[user.status])}>
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-3 text-[#555] font-medium">{user.tasks.toLocaleString()}</td>
              <td className="px-4 py-3 text-[#aaa]">{user.joined}</td>
              <td className="px-4 py-3 relative">
                <button
                  onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                  className="p-1.5 rounded-lg hover:bg-[#f0f0f0] text-[#aaa] hover:text-[#555] transition-colors"
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {openMenu === user.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute right-4 top-10 z-20 w-44 bg-white rounded-xl border border-[#e8e8e8] shadow-xl py-1.5"
                    >
                      {[
                        { icon: Eye,    label: "Impersonate",     action: "impersonate" },
                        { icon: Shield, label: "Change Role",     action: "role" },
                        { icon: KeyRound, label: "Reset Password", action: "reset" },
                        { icon: UserX,  label: "Suspend User",    action: "suspend", danger: true },
                      ].map(({ icon: Icon, label, action, danger }) => (
                        <button
                          key={action}
                          onClick={() => { onAction?.(action, user); setOpenMenu(null); }}
                          className={cn(
                            "flex items-center gap-2.5 w-full px-3 py-2 text-[13px] hover:bg-[#f5f5f5] transition-colors",
                            danger ? "text-red-500" : "text-[#333]"
                          )}
                        >
                          <Icon className="size-3.5" /> {label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
