import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckSquare, TrendingUp, Flame, Users, AlertTriangle, Zap } from "lucide-react";
import { AreaChartWidget, BarChartWidget } from "@/components/admin/AnalyticsChart";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => api.get<any>("/admin/analytics"),
    refetchInterval: 60000,
  });

  const kpis = [
    { label: "Tasks Completed",  value: data?.kpis?.completed ?? "—",   icon: CheckSquare,  color: "text-emerald-600 bg-emerald-50" },
    { label: "Overdue Tasks",    value: data?.kpis?.overdue ?? "—",     icon: AlertTriangle,color: "text-red-500 bg-red-50" },
    { label: "Active Users",     value: data?.kpis?.activeUsers ?? "—", icon: Users,        color: "text-purple-600 bg-purple-50" },
    { label: "Productivity Avg", value: "—",                            icon: TrendingUp,   color: "text-blue-600 bg-blue-50" },
    { label: "Longest Streak",   value: "—",                            icon: Flame,        color: "text-orange-500 bg-orange-50" },
    { label: "Automations Run",  value: "—",                            icon: Zap,          color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white rounded-xl border border-[#f0f0f0] p-4 shadow-sm">
            <div className={`size-8 rounded-lg grid place-items-center mb-2 ${color}`}>
              <Icon className="size-4" />
            </div>
            <p className="text-[20px] font-semibold text-[#0f0f0f]">{isLoading ? "—" : value}</p>
            <p className="text-[11px] text-[#888] mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm">
          <h3 className="text-[14px] font-semibold text-[#0f0f0f] mb-1">Task Completion Trend</h3>
          <p className="text-[12px] text-[#888] mb-4">Daily completed tasks (last 7 days)</p>
          {isLoading ? <Skeleton className="h-[180px] rounded-xl" /> : <AreaChartWidget data={data?.completionTrend ?? []} dataKey="tasks" color="#10b981" height={180} />}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm">
          <h3 className="text-[14px] font-semibold text-[#0f0f0f] mb-1">Overdue Tasks by Project</h3>
          <p className="text-[12px] text-[#888] mb-4">Projects with most overdue tasks</p>
          {isLoading ? <Skeleton className="h-[180px] rounded-xl" /> : <BarChartWidget data={data?.overdueByProject ?? []} dataKey="tasks" color="#f59e0b" height={180} />}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm">
          <h3 className="text-[14px] font-semibold text-[#0f0f0f] mb-4">Top Performers</h3>
          {isLoading
            ? <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8 rounded-xl" />)}</div>
            : (data?.topUsers ?? []).map((u: any, i: number) => (
              <div key={u.id} className="flex items-center gap-3 mb-3">
                <span className="text-[12px] font-bold text-[#ccc] w-4">{i + 1}</span>
                <div className="size-7 rounded-full bg-gradient-to-br from-[#db4035] to-[#e8534a] grid place-items-center text-white text-[10px] font-bold shrink-0">
                  {u.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-[#0f0f0f]">{u.name}</span>
                    <span className="text-[12px] font-semibold text-[#0f0f0f]">{u.completed} tasks</span>
                  </div>
                  <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(u.score, 100)}%` }} transition={{ duration: 0.6, delay: i * 0.08 + 0.3 }}
                      className="h-full bg-gradient-to-r from-[#db4035] to-[#e8534a] rounded-full" />
                  </div>
                </div>
              </div>
            ))
          }
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm">
          <h3 className="text-[14px] font-semibold text-[#0f0f0f] mb-4">User Productivity Scores</h3>
          {isLoading
            ? <Skeleton className="h-[200px] rounded-xl" />
            : <BarChartWidget data={(data?.topUsers ?? []).map((u: any) => ({ label: u.name.split(" ")[0], score: u.score }))} dataKey="score" color="#8b5cf6" height={200} />
          }
        </motion.div>
      </div>
    </div>
  );
}
