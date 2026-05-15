import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

const modules = ["All", "auth", "tasks", "projects", "leads", "admin", "support", "billing"];

export default function AdminActivityLogs() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("All");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-logs", search, module],
    queryFn: () => api.get<any[]>(`/admin/logs?search=${search}&module=${module === "All" ? "" : module}&limit=50`),
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-5 max-w-[1400px]">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[#f0f0f0]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#aaa]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs…"
              className="w-full h-8 pl-8 pr-3 text-[13px] bg-[#f5f5f5] rounded-lg border border-transparent focus:outline-none focus:border-[#e0e0e0] focus:bg-white transition-all placeholder:text-[#bbb]" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-[#aaa]" />
            <div className="flex flex-wrap gap-1">
              {modules.map(m => (
                <button key={m} onClick={() => setModule(m)}
                  className={`h-7 px-2.5 text-[11px] font-medium rounded-lg capitalize transition-colors ${module === m ? "bg-[#0f0f0f] text-white" : "bg-[#f5f5f5] text-[#555] hover:bg-[#ebebeb]"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[12px] text-[#888] ml-auto">{logs.length} entries</span>
        </div>

        <div className="px-5 py-2">
          {isLoading
            ? <div className="space-y-3 py-3">{Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            : logs.map((log: any, i: number) => (
              <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.02 }}
                className="flex items-start gap-3 py-3 border-b border-[#f5f5f5] last:border-0">
                <div className="size-7 rounded-lg bg-[#f5f5f5] grid place-items-center shrink-0 mt-0.5">
                  <Activity className="size-3.5 text-[#888]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#0f0f0f]">
                    <span className="font-medium">{log.actor ?? "System"}</span>
                    {" · "}
                    <span className="text-[#555]">{log.action}</span>
                  </p>
                  {log.details && <p className="text-[12px] text-[#888] mt-0.5 truncate">{log.details}</p>}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#bbb] bg-[#f5f5f5] px-1.5 py-0.5 rounded-full">{log.module}</span>
                    {log.ip_address && <span className="text-[10px] text-[#bbb]">{log.ip_address}</span>}
                  </div>
                </div>
                <span className="text-[11px] text-[#bbb] shrink-0 mt-0.5">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </motion.div>
            ))
          }
        </div>
      </motion.div>
    </div>
  );
}
