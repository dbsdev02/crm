import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Target, CheckSquare, FolderOpen, Users, Clock, TrendingUp,
  AlertTriangle, Award, CheckCircle2, Activity,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: any) => Number(n ?? 0);

const STAGE_LABELS: Record<string, string> = {
  lead_contacted: "Contacted", interested: "Interested",
  first_meet_confirmed: "1st Meet", followups: "Follow-up",
  negotiations: "Negotiation", onboarded: "Onboarded",
};

const STAGE_COLOR: Record<string, string> = {
  lead_contacted: "bg-slate-400", interested: "bg-blue-400",
  first_meet_confirmed: "bg-indigo-400", followups: "bg-yellow-400",
  negotiations: "bg-orange-400", onboarded: "bg-green-500",
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-red-500 bg-red-50", high: "text-orange-500 bg-orange-50",
  medium: "text-yellow-600 bg-yellow-50", low: "text-blue-500 bg-blue-50",
};

// ── sub-components ────────────────────────────────────────────────────────────
const StatCard = ({
  title, value, sub, icon: Icon, iconBg, trend,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string; trend?: { value: number; label: string };
}) => (
  <Card className="relative overflow-hidden">
    <CardContent className="pt-5 pb-4 px-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-[28px] font-bold text-[#202020] leading-tight mt-0.5">{value}</p>
          {sub && <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>}
          {trend && (
            <p className={cn("text-[11px] font-medium mt-1", trend.value >= 0 ? "text-green-600" : "text-red-500")}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)} {trend.label}
            </p>
          )}
        </div>
        <div className={cn("rounded-xl p-2.5", iconBg)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const MiniBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="h-1.5 w-full bg-[#f0f0f0] rounded-full overflow-hidden">
    <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
  </div>
);

// ── main ──────────────────────────────────────────────────────────────────────
const Index = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  // Single summary call for admin/staff
  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.get<any>("/reports/summary"),
    enabled: isAdmin || isStaff,
    refetchInterval: 60000,
  });

  // Staff personal data
  const { data: myTasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.get<any[]>("/tasks"),
  });

  const { data: myProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<any[]>("/projects"),
  });

  const { data: creditsData } = useQuery({
    queryKey: ["my-credits"],
    queryFn: () => api.get<any>("/credits/my"),
    enabled: isStaff,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => api.get<any[]>("/meetings"),
  });

  // ── derived ────────────────────────────────────────────────────────────────
  const tasks = myTasks as any[];
  const projects = myProjects as any[];

  const pendingTasks  = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const overdueTasks  = tasks.filter((t) => t.status === "overdue");
  const completedToday = tasks.filter((t) => {
    if (t.status !== "completed" || !t.completed_at) return false;
    return new Date(t.completed_at).toDateString() === new Date().toDateString();
  });

  const activeProjects = projects.filter((p) => ["in_progress", "active", "planning"].includes(p.status));

  const upcomingMeetings = (meetings as any[])
    .filter((m) => m.meeting_date && new Date(m.meeting_date) >= new Date())
    .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())
    .slice(0, 3);

  // summary shortcuts
  const s = summary;
  const taskStats    = s?.tasks;
  const leadStats    = s?.leads;
  const leaderboard  = s?.leaderboard ?? [];
  const byStage      = s?.leads?.byStage ?? [];
  const byUser       = s?.tasks?.byUser ?? [];
  const totalLeads   = fmt(leadStats?.total);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // ── STAFF VIEW ─────────────────────────────────────────────────────────────
  if (isStaff) {
    return (
      <div className="space-y-5 p-4 md:p-6">
        {/* Greeting */}
        <div>
          <h1 className="text-[22px] font-bold text-[#202020]">Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-[13px] text-muted-foreground">{today}</p>
        </div>

        {/* Staff stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Pending Tasks" value={pendingTasks.length} sub="to complete" icon={CheckSquare} iconBg="bg-blue-500" />
          <StatCard title="Overdue" value={overdueTasks.length} sub="need attention" icon={AlertTriangle} iconBg="bg-red-500" />
          <StatCard title="Done Today" value={completedToday.length} sub="tasks completed" icon={CheckCircle2} iconBg="bg-green-500" />
          <StatCard title="Credits" value={creditsData?.balance?.credits ?? 0} sub={`${creditsData?.balance?.points ?? 0} pts`} icon={Award} iconBg="bg-purple-500" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* My pending tasks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" /> My Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingTasks.length === 0 && overdueTasks.length === 0 ? (
                <p className="text-[13px] text-muted-foreground py-4 text-center">All caught up! 🎉</p>
              ) : (
                [...overdueTasks, ...pendingTasks].slice(0, 6).map((t: any) => (
                  <div key={t.id} className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 border",
                    t.status === "overdue" ? "border-red-200 bg-red-50" : "border-[#f0f0f0] bg-white"
                  )}>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#202020] truncate">{t.title}</p>
                      {t.due_date && (
                        <p className="text-[11px] text-muted-foreground">
                          Due {new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0", PRIORITY_COLOR[t.priority] || PRIORITY_COLOR.medium)}>
                      {t.status === "overdue" ? "OVERDUE" : (t.priority || "medium").toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming meetings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" /> Upcoming Meetings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingMeetings.length === 0 ? (
                <p className="text-[13px] text-muted-foreground py-4 text-center">No upcoming meetings</p>
              ) : (
                upcomingMeetings.map((m: any) => (
                  <div key={m.id} className="flex items-start justify-between rounded-lg border border-[#f0f0f0] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#202020] truncate">{m.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(m.meeting_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" · "}
                        {new Date(m.meeting_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    {m.meeting_link && (
                      <a href={m.meeting_link} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline shrink-0 ml-2">Join</a>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Active projects */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-indigo-500" /> Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeProjects.length === 0 ? (
                <p className="text-[13px] text-muted-foreground py-2 text-center">No active projects</p>
              ) : (
                activeProjects.slice(0, 4).map((p: any) => (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-[#202020]">{p.name}</span>
                      <span className="text-[12px] text-muted-foreground">{p.progress ?? 0}%</span>
                    </div>
                    <Progress value={p.progress ?? 0} className="h-1.5" />
                    {p.client_name && <p className="text-[11px] text-muted-foreground">{p.client_name}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#202020]">Dashboard</h1>
          <p className="text-[13px] text-muted-foreground">{today}</p>
        </div>
        <Badge variant="outline" className="text-[11px]">This Month</Badge>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Leads" value={totalLeads}
          sub={`${fmt(leadStats?.converted)} converted`}
          icon={Target} iconBg="bg-[#db4035]"
        />
        <StatCard
          title="Tasks" value={fmt(taskStats?.total)}
          sub={`${fmt(taskStats?.completed)} completed`}
          icon={CheckSquare} iconBg="bg-blue-500"
        />
        <StatCard
          title="Projects" value={fmt(s?.projects?.total)}
          sub={`${fmt(s?.projects?.in_progress)} in progress`}
          icon={FolderOpen} iconBg="bg-indigo-500"
        />
        <StatCard
          title="Overdue Tasks" value={fmt(taskStats?.overdue)}
          sub={`${fmt(taskStats?.on_time)} on time`}
          icon={AlertTriangle} iconBg={fmt(taskStats?.overdue) > 0 ? "bg-red-500" : "bg-green-500"}
        />
      </div>

      {/* Row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Lead Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#db4035]" /> Lead Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(STAGE_LABELS).map((stage) => {
              const count = byStage.find((s: any) => s.stage === stage)?.count ?? 0;
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#555]">{STAGE_LABELS[stage]}</span>
                    <span className="text-[12px] font-semibold text-[#202020]">{count}</span>
                  </div>
                  <MiniBar value={count} max={totalLeads || 1} color={STAGE_COLOR[stage]} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Task breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-blue-500" /> Task Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Completed", value: fmt(taskStats?.completed), color: "bg-green-500", total: fmt(taskStats?.total) },
              { label: "In Progress", value: fmt(taskStats?.in_progress), color: "bg-blue-400", total: fmt(taskStats?.total) },
              { label: "Pending", value: fmt(taskStats?.pending), color: "bg-yellow-400", total: fmt(taskStats?.total) },
              { label: "Overdue", value: fmt(taskStats?.overdue), color: "bg-red-500", total: fmt(taskStats?.total) },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#555]">{item.label}</span>
                  <span className="text-[12px] font-semibold text-[#202020]">{item.value}</span>
                </div>
                <MiniBar value={item.value} max={item.total || 1} color={item.color} />
              </div>
            ))}
            <div className="pt-2 border-t border-[#f0f0f0] flex justify-between text-[11px] text-muted-foreground">
              <span>On-time rate</span>
              <span className="font-semibold text-green-600">
                {taskStats?.completed > 0
                  ? Math.round((fmt(taskStats?.on_time) / fmt(taskStats?.completed)) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming meetings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" /> Upcoming Meetings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingMeetings.length === 0 ? (
              <p className="text-[13px] text-muted-foreground py-4 text-center">No upcoming meetings</p>
            ) : (
              upcomingMeetings.map((m: any) => (
                <div key={m.id} className="rounded-lg border border-[#f0f0f0] px-3 py-2.5 space-y-0.5">
                  <p className="text-[13px] font-medium text-[#202020] truncate">{m.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(m.meeting_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" · "}
                    {new Date(m.meeting_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                  {m.meeting_link && (
                    <a href={m.meeting_link} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline">Join Meet →</a>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Team performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" /> Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byUser.length === 0 ? (
              <p className="text-[13px] text-muted-foreground py-2 text-center">No task data this month</p>
            ) : (
              byUser.slice(0, 6).map((u: any) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px] bg-[#f0f0f0] text-[#555]">
                      {u.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[12px] font-medium text-[#202020] truncate">{u.name}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                        {u.completed}/{u.total}
                      </span>
                    </div>
                    <MiniBar value={fmt(u.completed)} max={fmt(u.total) || 1} color="bg-indigo-400" />
                  </div>
                  {fmt(u.overdue) > 0 && (
                    <span className="text-[10px] text-red-500 font-semibold shrink-0">{u.overdue} late</span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Project progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-indigo-500" /> Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeProjects.length === 0 ? (
              <p className="text-[13px] text-muted-foreground py-2 text-center">No active projects</p>
            ) : (
              activeProjects.slice(0, 5).map((p: any) => (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[#202020] truncate">{p.name}</span>
                    <span className="text-[12px] text-muted-foreground shrink-0 ml-2">{p.progress ?? 0}%</span>
                  </div>
                  <Progress value={p.progress ?? 0} className="h-1.5" />
                  {p.client_name && <p className="text-[11px] text-muted-foreground">{p.client_name}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Credits leaderboard */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" /> Credits Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {leaderboard.slice(0, 5).map((u: any, i: number) => (
                <div key={u.name} className={cn(
                  "flex flex-col items-center rounded-xl border p-3 text-center",
                  i === 0 ? "border-yellow-300 bg-yellow-50" : "border-[#f0f0f0] bg-white"
                )}>
                  <span className="text-[18px] mb-1">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                  <Avatar className="h-8 w-8 mb-1.5">
                    <AvatarFallback className="text-[11px] bg-[#f0f0f0] text-[#555]">
                      {u.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-[12px] font-semibold text-[#202020] truncate w-full">{u.name}</p>
                  <p className="text-[13px] font-bold text-[#db4035]">{u.credits} <span className="text-[10px] font-normal text-muted-foreground">credits</span></p>
                  <p className="text-[11px] text-muted-foreground">{u.points} pts</p>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="col-span-full text-[13px] text-muted-foreground text-center py-4">No credit data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default Index;
