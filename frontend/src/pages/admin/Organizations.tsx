import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Users, TrendingUp, Globe, MoreHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOrganizations() {
  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["admin-organizations"],
    queryFn: () => api.get<any[]>("/admin/organizations"),
  });

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Orgs",    value: orgs.length,                                       icon: Building2,  color: "text-blue-600 bg-blue-50" },
          { label: "Total Members", value: orgs.reduce((s: number, o: any) => s + (o.members ?? 0), 0), icon: Users, color: "text-purple-600 bg-purple-50" },
          { label: "Domains",       value: orgs.length,                                       icon: Globe,      color: "text-emerald-600 bg-emerald-50" },
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
          <h3 className="text-[14px] font-semibold text-[#0f0f0f]">Organizations by Domain</h3>
          <p className="text-[12px] text-[#888] mt-0.5">Grouped from registered user email domains</p>
        </div>
        {isLoading
          ? <div className="p-5 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#f0f0f0]">
                    {["Domain", "Members", "Roles", "Joined", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((org: any, i: number) => (
                    <motion.tr key={org.domain} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-[#f8f8f8] hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] grid place-items-center text-white text-[11px] font-bold shrink-0">
                            {org.domain[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-[#0f0f0f]">{org.domain}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#555]">{org.members}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {String(org.roles).split(",").map((r: string) => (
                            <span key={r} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#f0f0f0] text-[#555]">{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#aaa]">{new Date(org.joined).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-3">
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
      </motion.div>
    </div>
  );
}
