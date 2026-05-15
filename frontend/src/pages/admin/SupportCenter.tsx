import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, LifeBuoy, Bug, Lightbulb, MessageSquare, ChevronRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  bug:      { icon: Bug,           color: "text-red-500 bg-red-50",      label: "Bug" },
  feature:  { icon: Lightbulb,     color: "text-amber-600 bg-amber-50",  label: "Feature" },
  support:  { icon: LifeBuoy,      color: "text-blue-600 bg-blue-50",    label: "Support" },
  feedback: { icon: MessageSquare, color: "text-purple-600 bg-purple-50",label: "Feedback" },
};

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  open:        { icon: AlertCircle,  color: "text-amber-600 bg-amber-50",    label: "Open" },
  in_progress: { icon: Clock,        color: "text-blue-600 bg-blue-50",      label: "In Progress" },
  resolved:    { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50",label: "Resolved" },
};

const priorityColor: Record<string, string> = {
  high:   "text-red-500 bg-red-50",
  medium: "text-amber-600 bg-amber-50",
  low:    "text-gray-500 bg-gray-100",
};

const typeFilters   = ["all", "bug", "feature", "support", "feedback"];
const statusFilters = ["all", "open", "in_progress", "resolved"];

export default function AdminSupport() {
  const [search, setSearch]           = useState("");
  const [typeFilter, setTypeFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-support", typeFilter, statusFilter],
    queryFn: () => api.get<any[]>(`/admin/support?type=${typeFilter}&status=${statusFilter}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/admin/support/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-support"] });
      toast({ title: "Ticket updated" });
    },
  });

  const filtered = tickets.filter((t: any) =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    open:        tickets.filter((t: any) => t.status === "open").length,
    in_progress: tickets.filter((t: any) => t.status === "in_progress").length,
    resolved:    tickets.filter((t: any) => t.status === "resolved").length,
    bugs:        tickets.filter((t: any) => t.type === "bug").length,
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Open Tickets",  value: counts.open,        color: "text-amber-600 bg-amber-50",    icon: AlertCircle },
          { label: "In Progress",   value: counts.in_progress, color: "text-blue-600 bg-blue-50",      icon: Clock },
          { label: "Resolved",      value: counts.resolved,    color: "text-emerald-600 bg-emerald-50",icon: CheckCircle2 },
          { label: "Bug Reports",   value: counts.bugs,        color: "text-red-500 bg-red-50",        icon: Bug },
        ].map(({ label, value, color, icon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-[#f0f0f0] px-4 py-3 shadow-sm flex items-center gap-3">
            <div className={`size-9 rounded-xl grid place-items-center shrink-0 ${color}`}>
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-[11px] text-[#888] uppercase tracking-wider">{label}</p>
              <p className="text-[20px] font-semibold text-[#0f0f0f]">{isLoading ? "—" : value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tickets */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[#f0f0f0]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#aaa]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…"
              className="w-full h-8 pl-8 pr-3 text-[13px] bg-[#f5f5f5] rounded-lg border border-transparent focus:outline-none focus:border-[#e0e0e0] focus:bg-white transition-all placeholder:text-[#bbb]" />
          </div>
          <div className="flex gap-1">
            {typeFilters.map(f => (
              <button key={f} onClick={() => setTypeFilter(f)}
                className={cn("h-7 px-2.5 text-[11px] font-medium rounded-lg capitalize transition-colors",
                  typeFilter === f ? "bg-[#0f0f0f] text-white" : "bg-[#f5f5f5] text-[#555] hover:bg-[#ebebeb]")}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {statusFilters.map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={cn("h-7 px-2.5 text-[11px] font-medium rounded-lg capitalize transition-colors",
                  statusFilter === f ? "bg-[#0f0f0f] text-white" : "bg-[#f5f5f5] text-[#555] hover:bg-[#ebebeb]")}>
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading
          ? <div className="p-5 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          : filtered.length === 0
            ? <p className="text-[13px] text-[#aaa] text-center py-12">No tickets found</p>
            : (
              <div className="divide-y divide-[#f8f8f8]">
                {filtered.map((t: any, i: number) => {
                  const type   = typeConfig[t.type]   ?? typeConfig.support;
                  const status = statusConfig[t.status] ?? statusConfig.open;
                  const TypeIcon   = type.icon;
                  const StatusIcon = status.icon;
                  return (
                    <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-[#fafafa] transition-colors group">
                      <div className={cn("size-8 rounded-lg grid place-items-center shrink-0", type.color)}>
                        <TypeIcon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-[#aaa]">#{t.id}</span>
                          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize", priorityColor[t.priority] ?? priorityColor.medium)}>
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-[13px] font-medium text-[#0f0f0f] mt-0.5 truncate">{t.title}</p>
                        <p className="text-[12px] text-[#888] mt-0.5">{t.user_name} · {t.user_email}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Status changer */}
                        <select
                          value={t.status}
                          onChange={e => updateMutation.mutate({ id: t.id, status: e.target.value })}
                          className={cn("text-[11px] font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none", status.color)}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <span className="text-[11px] text-[#bbb]">
                          {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                        <ChevronRight className="size-4 text-[#ddd] group-hover:text-[#aaa] transition-colors" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )
        }
        <div className="px-5 py-3 border-t border-[#f5f5f5]">
          <span className="text-[12px] text-[#888]">Showing {filtered.length} of {tickets.length} tickets</span>
        </div>
      </motion.div>
    </div>
  );
}
