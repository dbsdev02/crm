import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Briefcase, Users, CheckSquare, MoreHorizontal, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const statusColor: Record<string, string> = {
  planning:    "text-blue-600 bg-blue-50",
  in_progress: "text-amber-600 bg-amber-50",
  on_hold:     "text-gray-500 bg-gray-100",
  completed:   "text-emerald-600 bg-emerald-50",
  cancelled:   "text-red-500 bg-red-50",
};

export default function AdminWorkspaces() {
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["admin-workspaces"],
    queryFn: () => api.get<any[]>("/admin/workspaces"),
  });

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Projects",  value: workspaces.length,                                                    icon: Briefcase,   color: "text-blue-600 bg-blue-50" },
          { label: "Active",          value: workspaces.filter((w: any) => w.status === "in_progress").length,     icon: CheckSquare, color: "text-emerald-600 bg-emerald-50" },
          { label: "Total Members",   value: workspaces.reduce((s: number, w: any) => s + (w.members ?? 0), 0),    icon: Users,       color: "text-purple-600 bg-purple-50" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-[#f0f0f0] px-4 py-3 shadow-sm flex items-center gap-3">
            <div className={`size-9 rounded-xl grid place-items-center shrink-0 ${color}`}><Icon className="size-4" /></div>
            <div>
              <p className="text-[11px] text-[#888] uppercase tracking-wider">{label}</p>
              <p className="text-[20px] font-semibold text-[#0f0f0f]">{isLoading ? "—" : value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0f0f0]">
          <h3 className="text-[14px] font-semibold text-[#0f0f0f]">All Workspaces (Projects)</h3>
        </div>
        {isLoading
          ? <div className="p-5 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#f0f0f0]">
                    {["Workspace", "Owner", "Members", "Tasks", "Assets", "Status", "Created", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workspaces.map((ws: any, i: number) => (
                    <motion.tr key={ws.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-[#f8f8f8] hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-gradient-to-br from-[#db4035] to-[#e8534a] grid place-items-center text-white text-[11px] font-bold shrink-0">
                            {ws.name[0]}
                          </div>
                          <span className="font-medium text-[#0f0f0f] truncate max-w-[160px]">{ws.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#555]">{ws.owner}</td>
                      <td className="px-4 py-3 text-[#555]">{ws.members}</td>
                      <td className="px-4 py-3 text-[#555]">{ws.tasks}</td>
                      <td className="px-4 py-3 text-[#555]">{ws.assets}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full capitalize", statusColor[ws.status] ?? statusColor.planning)}>
                          {ws.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#aaa]">{new Date(ws.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-3 flex items-center gap-1">
                        <a href={`/projects/${ws.id}`} className="p-1.5 rounded-lg hover:bg-[#f0f0f0] text-[#bbb] hover:text-[#555] transition-colors">
                          <ExternalLink className="size-3.5" />
                        </a>
                        <button className="p-1.5 rounded-lg hover:bg-[#f0f0f0] text-[#bbb] hover:text-[#555] transition-colors">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        <div className="px-5 py-3 border-t border-[#f5f5f5]">
          <span className="text-[12px] text-[#888]">{workspaces.length} workspaces total</span>
        </div>
      </motion.div>
    </div>
  );
}
