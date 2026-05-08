import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckSquare, Target, FolderOpen, Award, TrendingUp,
  Clock, AlertCircle, Users, Calendar, Search, X, ChevronLeft,
  CheckCircle2, AlertTriangle,
} from "lucide-react";

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: any) => Number(n || 0).toLocaleString();
const pct = (a: any, b: any) => (b > 0 ? Math.round((Number(a) / Number(b)) * 100) : 0);

const STAGE_LABEL: Record<string, string> = {
  lead_contacted: "Contacted", interested: "Interested",
  first_meet_confirmed: "Meeting", followups: "Follow-up",
  negotiations: "Negotiation", uninterested: "Lost", onboarded: "Won",
};

const STAGE_COLOR: Record<string, string> = {
  lead_contacted: "bg-gray-400", interested: "bg-blue-400",
  first_meet_confirmed: "bg-indigo-400", followups: "bg-yellow-400",
  negotiations: "bg-orange-400", uninterested: "bg-red-400", onboarded: "bg-green-500",
};

// ── sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4 flex items-start gap-3 shadow-sm">
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-[22px] font-bold text-[#202020] leading-tight">{value}</p>
        <p className="text-[12px] text-[#888]">{label}</p>
        {sub && <p className="text-[11px] text-[#aaa] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function BarChart({ data, max, colorClass }: {
  data: { label: string; value: number }[];
  max: number; colorClass: string;
}) {
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="text-[12px] text-[#666] w-28 truncate shrink-0">{d.label}</span>
          <div className="flex-1 bg-[#f5f5f5] rounded-full h-2">
            <div
              className={cn("h-2 rounded-full transition-all", colorClass)}
              style={{ width: max > 0 ? `${(d.value / max) * 100}%` : "0%" }}
            />
          </div>
          <span className="text-[12px] font-medium text-[#444] w-6 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ trend }: { trend: { date: string; count: number }[] }) {
  if (!trend.length) return <p className="text-[13px] text-[#aaa] text-center py-6">No data</p>;
  const max = Math.max(...trend.map((t) => t.count), 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {trend.map((t) => (
        <div key={t.date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full bg-[#db4035] rounded-t-sm opacity-80 hover:opacity-100 transition-all"
            style={{ height: `${(t.count / max) * 72}px` }}
          />
          <span className="text-[9px] text-[#bbb] rotate-45 origin-left hidden group-hover:block absolute -bottom-4 left-0 whitespace-nowrap">
            {t.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Member report panel ──────────────────────────────────────────────────────
function MemberReport({ memberId, from, to, onBack }: {
  memberId: string; from: string; to: string; onBack: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["report-member", memberId, from, to],
    queryFn: () => api.get<any>(`/reports/member/${memberId}?from=${from}&to=${to}`),
    enabled: !!memberId,
  });

  if (isLoading) return <div className="py-10 text-center text-[13px] text-[#aaa]">Loading…</div>;
  if (!data) return null;

  const t  = data.tasks   || {};
  const l  = data.leads   || {};
  const cr = data.credits || { points: 0, credits: 0 };
  const completed  = Number(t.completed  || 0);
  const total      = Number(t.total      || 0);
  const onTime     = Number(t.on_time    || 0);
  const overdue    = Number(t.overdue    || 0);

  return (
    <div className="space-y-4">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-[12px] text-[#888] hover:text-[#333] transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-[#db4035] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
            {data.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#202020]">{data.user.name}</p>
            <p className="text-[11px] text-[#888] capitalize">{data.user.role} · {data.user.email}</p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={CheckSquare} label="Tasks Assigned" value={total}      color="bg-blue-500"   sub={`${completed} completed`} />
        <StatCard icon={Clock}       label="On-time Rate"   value={`${pct(onTime, completed)}%`} color="bg-green-500" sub={`${onTime} of ${completed}`} />
        <StatCard icon={AlertCircle} label="Overdue"        value={overdue}    color="bg-red-500" />
        <StatCard icon={Award}       label="Credits"        value={cr.credits} color="bg-yellow-500" sub={`${cr.points} pts`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Task status breakdown */}
        <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4 shadow-sm">
          <p className="text-[13px] font-semibold text-[#333] mb-3">Tasks by Status</p>
          <BarChart colorClass="bg-blue-400" max={total || 1} data={[
            { label: "Completed",   value: Number(t.completed   || 0) },
            { label: "In Progress", value: Number(t.in_progress || 0) },
            { label: "Pending",     value: Number(t.pending     || 0) },
            { label: "Overdue",     value: Number(t.overdue     || 0) },
          ]} />
        </div>

        {/* Daily trend */}
        <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4 shadow-sm">
          <p className="text-[13px] font-semibold text-[#333] mb-3">Completion Trend</p>
          <TrendChart trend={t.trend || []} />
        </div>
      </div>

      {/* Leads */}
      <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4 shadow-sm">
        <p className="text-[13px] font-semibold text-[#333] mb-3">Leads</p>
        <div className="flex gap-6">
          <div><p className="text-[20px] font-bold text-[#202020]">{fmt(l.total)}</p><p className="text-[11px] text-[#888]">Assigned</p></div>
          <div><p className="text-[20px] font-bold text-green-600">{fmt(l.converted)}</p><p className="text-[11px] text-[#888]">Won</p></div>
          <div><p className="text-[20px] font-bold text-red-500">{fmt(l.lost)}</p><p className="text-[11px] text-[#888]">Lost</p></div>
          <div><p className="text-[20px] font-bold text-[#db4035]">RM {fmt(l.won_value)}</p><p className="text-[11px] text-[#888]">Won Value</p></div>
        </div>
      </div>

      {/* Recent completed tasks */}
      {(t.recent || []).length > 0 && (
        <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4 shadow-sm">
          <p className="text-[13px] font-semibold text-[#333] mb-3">Recently Completed</p>
          <div className="space-y-2">
            {(t.recent as any[]).map((task: any) => (
              <div key={task.id} className="flex items-center gap-2.5 py-1">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="flex-1 text-[13px] text-[#333] truncate">{task.title}</span>
                {task.project_name && <span className="text-[11px] text-[#aaa] truncate max-w-[100px]">{task.project_name}</span>}
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
                  task.timing === "on_time" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                )}>{task.timing === "on_time" ? "On time" : "Late"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending / overdue tasks */}
      {(t.pending || []).length > 0 && (
        <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4 shadow-sm">
          <p className="text-[13px] font-semibold text-[#333] mb-3">Pending / Overdue</p>
          <div className="space-y-2">
            {(t.pending as any[]).map((task: any) => (
              <div key={task.id} className="flex items-center gap-2.5 py-1">
                <AlertTriangle className={cn("h-4 w-4 shrink-0", task.status === "overdue" ? "text-red-500" : "text-orange-400")} />
                <span className="flex-1 text-[13px] text-[#333] truncate">{task.title}</span>
                {task.due_date && <span className="text-[11px] text-[#aaa]">{task.due_date.slice(0, 10)}</span>}
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
                  task.status === "overdue" ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"
                )}>{task.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().setDate(1)).toISOString().slice(0, 10);

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo]     = useState(today);

  // Staff search
  const [search, setSearch]           = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: members = [] } = useQuery({
    queryKey: ["report-members", from, to],
    queryFn: () => api.get<any[]>(`/reports/members?from=${from}&to=${to}`),
    enabled: isAdmin,
  });

  const filtered = search.trim()
    ? (members as any[]).filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reports", from, to],
    queryFn: () => api.get<any>(`/reports/summary?from=${from}&to=${to}`),
  });

  const tasks    = data?.tasks    || {};
  const leads    = data?.leads    || {};
  const projects = data?.projects || {};
  const board    = data?.leaderboard || [];

  const taskTotal     = Number(tasks.total     || 0);
  const taskCompleted = Number(tasks.completed || 0);
  const taskOverdue   = Number(tasks.overdue   || 0);
  const taskOnTime    = Number(tasks.on_time   || 0);
  const leadTotal     = Number(leads.total     || 0);
  const leadConverted = Number(leads.converted || 0);

  const byUser: { label: string; value: number }[] = (tasks.byUser || []).map((u: any) => ({
    label: u.name, value: Number(u.completed),
  }));
  const maxUser = Math.max(...byUser.map((u) => u.value), 1);

  const byStage: { label: string; value: number; stage: string }[] = (leads.byStage || []).map((s: any) => ({
    label: STAGE_LABEL[s.stage] || s.stage,
    value: Number(s.count),
    stage: s.stage,
  }));
  const maxStage = Math.max(...byStage.map((s) => s.value), 1);

  return (
    <div className="flex flex-col h-full bg-[#f7f7f7] min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-[#f7f7f7] sticky top-0 z-10 flex-wrap gap-2">
        <h1 className="text-[20px] font-bold text-[#202020]">Reports</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-[#e5e5e5] rounded-xl px-3 py-1.5 text-[12px]">
            <Calendar className="h-3.5 w-3.5 text-[#aaa]" />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="bg-transparent outline-none text-[#555] cursor-pointer" />
            <span className="text-[#ccc]">→</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="bg-transparent outline-none text-[#555] cursor-pointer" />
          </div>
          {/* Quick ranges */}
          {[
            { label: "This month", from: firstOfMonth, to: today },
            { label: "Last 7d", from: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), to: today },
            { label: "Last 30d", from: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10), to: today },
          ].map((r) => (
            <button key={r.label}
              onClick={() => { setFrom(r.from); setTo(r.to); }}
              className={cn(
                "text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors",
                from === r.from && to === r.to
                  ? "bg-[#db4035] text-white border-[#db4035]"
                  : "bg-white border-[#e5e5e5] text-[#666] hover:border-[#aaa]"
              )}
            >{r.label}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-[#aaa] text-[14px]">Loading…</div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-5">

          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={CheckSquare} label="Tasks Total"     value={fmt(taskTotal)}     color="bg-blue-500"
              sub={`${taskCompleted} completed`} />
            <StatCard icon={Clock}       label="On-time Rate"    value={`${pct(taskOnTime, taskCompleted)}%`} color="bg-green-500"
              sub={`${taskOnTime} of ${taskCompleted}`} />
            <StatCard icon={AlertCircle} label="Overdue Tasks"   value={fmt(taskOverdue)}   color="bg-red-500" />
            <StatCard icon={Target}      label="Leads"           value={fmt(leadTotal)}
              sub={`${leadConverted} converted`} color="bg-orange-500" />
            <StatCard icon={TrendingUp}  label="Conversion Rate" value={`${pct(leadConverted, leadTotal)}%`} color="bg-purple-500" />
            <StatCard icon={Award}       label="Won Value"       value={`RM ${fmt(leads.won_value)}`} color="bg-yellow-500" />
            <StatCard icon={FolderOpen}  label="Projects"        value={fmt(projects.total)}
              sub={`${projects.completed || 0} done`} color="bg-indigo-500" />
            <StatCard icon={Users}       label="Active Staff"    value={board.length}       color="bg-teal-500" />
          </div>

          {/* ── Task completion trend ── */}
          <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4 shadow-sm">
            <p className="text-[13px] font-semibold text-[#333] mb-3">Tasks Completed — Daily Trend</p>
            <TrendChart trend={tasks.trend || []} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── Tasks by status ── */}
            <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4 shadow-sm">
              <p className="text-[13px] font-semibold text-[#333] mb-3">Tasks by Status</p>
              <BarChart
                colorClass="bg-blue-400"
                max={taskTotal || 1}
                data={[
                  { label: "Completed",   value: Number(tasks.completed   || 0) },
                  { label: "In Progress", value: Number(tasks.in_progress || 0) },
                  { label: "Pending",     value: Number(tasks.pending     || 0) },
                  { label: "Overdue",     value: Number(tasks.overdue     || 0) },
                ]}
              />
            </div>

            {/* ── Leads by stage ── */}
            <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4 shadow-sm">
              <p className="text-[13px] font-semibold text-[#333] mb-3">Leads by Stage</p>
              {byStage.length === 0
                ? <p className="text-[13px] text-[#aaa] text-center py-6">No leads in period</p>
                : (
                  <div className="space-y-2">
                    {byStage.map((s) => (
                      <div key={s.stage} className="flex items-center gap-2">
                        <span className="text-[12px] text-[#666] w-24 truncate shrink-0">{s.label}</span>
                        <div className="flex-1 bg-[#f5f5f5] rounded-full h-2">
                          <div className={cn("h-2 rounded-full transition-all", STAGE_COLOR[s.stage] || "bg-gray-400")}
                            style={{ width: `${(s.value / maxStage) * 100}%` }} />
                        </div>
                        <span className="text-[12px] font-medium text-[#444] w-6 text-right">{s.value}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* ── Staff performance ── */}
            <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4 shadow-sm">
              <p className="text-[13px] font-semibold text-[#333] mb-3">Tasks Completed by Staff</p>
              {byUser.length === 0
                ? <p className="text-[13px] text-[#aaa] text-center py-6">No data</p>
                : <BarChart colorClass="bg-green-400" max={maxUser} data={byUser} />
              }
            </div>

            {/* ── Projects breakdown ── */}
            <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4 shadow-sm">
              <p className="text-[13px] font-semibold text-[#333] mb-3">Projects by Status</p>
              <BarChart
                colorClass="bg-indigo-400"
                max={Number(projects.total) || 1}
                data={[
                  { label: "In Progress", value: Number(projects.in_progress || 0) },
                  { label: "Completed",   value: Number(projects.completed   || 0) },
                  { label: "Planning",    value: Number(projects.planning    || 0) },
                  { label: "On Hold",     value: Number(projects.on_hold     || 0) },
                ]}
              />
            </div>
          </div>

          {/* ── Credits leaderboard ── */}
          <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4 shadow-sm">
            <p className="text-[13px] font-semibold text-[#333] mb-3">Credits Leaderboard</p>
            {board.length === 0
              ? <p className="text-[13px] text-[#aaa] text-center py-6">No data</p>
              : (
                <div className="space-y-2">
                  {board.map((u: any, i: number) => (
                    <div key={u.name} className="flex items-center gap-3">
                      <span className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                        i === 0 ? "bg-yellow-400 text-white" :
                        i === 1 ? "bg-gray-300 text-white" :
                        i === 2 ? "bg-orange-300 text-white" : "bg-[#f0f0f0] text-[#888]"
                      )}>{i + 1}</span>
                      <span className="flex-1 text-[13px] text-[#333] truncate">{u.name}</span>
                      <span className="text-[12px] text-[#888]">{u.points} pts</span>
                      <span className="text-[12px] font-semibold text-[#db4035] w-16 text-right">{u.credits} credits</span>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

        </div>
      )}
    </div>
  );
}
