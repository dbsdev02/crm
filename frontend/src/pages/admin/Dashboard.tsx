import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, Building2, CheckSquare, Zap, Wifi, TrendingUp, Activity, BarChart3, Clock,
} from "lucide-react";
import { KPICard } from "@/components/admin/KPICard";
import { AreaChartWidget, BarChartWidget } from "@/components/admin/AnalyticsChart";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton() {
  return <Skeleton className="h-[100px] rounded-2xl" />;
}

const systemStatus = [
  { name: "API Gateway",        status: "operational", latency: "12ms" },
  { name: "Database",           status: "operational", latency: "4ms" },
  { name: "Automation Engine",  status: "degraded",    latency: "340ms" },
  { name: "Notification Queue", status: "operational", latency: "28ms" },
  { name: "AI Parser",          status: "operational", latency: "180ms" },
];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get<any>("/admin/dashboard"),
    refetchInterval: 30000,
  });

  const kpis = data ? [
    { title: "Total Users",        value: data.kpis.totalUsers?.toLocaleString() ?? "—",    change: `${data.kpis.activeUsers} active`,  trend: "up"      as const, icon: Users,       iconColor: "text-blue-600",    iconBg: "bg-blue-50" },
    { title: "Tasks Today",        value: data.kpis.tasksToday?.toLocaleString() ?? "—",    change: "Created today",                    trend: "up"      as const, icon: CheckSquare, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { title: "Active Automations", value: data.kpis.activeAutomations?.toLocaleString() ?? "0", change: "Running now",                  trend: "neutral" as const, icon: Zap,         iconColor: "text-amber-600",   iconBg: "bg-amber-50" },
    { title: "Active Sessions",    value: data.kpis.activeSessions?.toLocaleString() ?? "—", change: "Last 1 hour",                    trend: "neutral" as const, icon: Wifi,        iconColor: "text-indigo-600",  iconBg: "bg-indigo-50" },
    { title: "Productivity",       value: "—",                                               change: "Calculated from tasks",           trend: "up"      as const, icon: TrendingUp,  iconColor: "text-teal-600",    iconBg: "bg-teal-50" },
    { title: "System Health",      value: "99.8%",                                           change: "All systems normal",              trend: "up"      as const, icon: Activity,    iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
  ] : [];

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoading
          ? Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
          : kpis.map((k, i) => <KPICard key={k.title} {...k} index={i} />)
        }
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[#0f0f0f]">User Growth</h3>
              <p className="text-[12px] text-[#888] mt-0.5">New users per month</p>
            </div>
          </div>
          {isLoading
            ? <Skeleton className="h-[180px] rounded-xl" />
            : <AreaChartWidget data={data?.userGrowth ?? []} dataKey="users" color="#db4035" height={180} />
          }
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[#0f0f0f]">Daily Task Volume</h3>
              <p className="text-[12px] text-[#888] mt-0.5">Tasks created this week</p>
            </div>
            <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <BarChart3 className="size-3" /> This week
            </span>
          </div>
          {isLoading
            ? <Skeleton className="h-[180px] rounded-xl" />
            : <BarChartWidget data={data?.taskVolume ?? []} dataKey="tasks" color="#6366f1" height={180} />
          }
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Activity Feed */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-[#0f0f0f]">Recent Activity</h3>
            <a href="/admin/logs" className="text-[12px] text-[#db4035] hover:underline">View all →</a>
          </div>
          {isLoading
            ? <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            : (data?.activity ?? []).map((item: any, i: number) => (
              <div key={item.id} className="flex items-start gap-3 py-3 border-b border-[#f5f5f5] last:border-0">
                <div className="size-7 rounded-lg bg-[#f5f5f5] grid place-items-center shrink-0 mt-0.5">
                  <Activity className="size-3.5 text-[#888]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#0f0f0f]">
                    <span className="font-medium">{item.actor ?? "System"}</span>
                    {" · "}
                    <span className="text-[#555]">{item.action}</span>
                  </p>
                  {item.details && <p className="text-[12px] text-[#888] mt-0.5 truncate">{item.details}</p>}
                </div>
                <span className="text-[11px] text-[#bbb] shrink-0 mt-0.5">
                  {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          }
        </motion.div>

        {/* System Status */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-[#0f0f0f]">System Status</h3>
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-3">
            {systemStatus.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full shrink-0 ${s.status === "operational" ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className="text-[13px] text-[#333]">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#aaa] flex items-center gap-1"><Clock className="size-3" />{s.latency}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${s.status === "operational" ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"}`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#f5f5f5]">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#888]">Overall uptime</span>
              <span className="font-semibold text-emerald-600">99.8%</span>
            </div>
            <div className="mt-2 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: "99.8%" }} transition={{ duration: 0.8, delay: 0.5 }}
                className="h-full bg-emerald-400 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
