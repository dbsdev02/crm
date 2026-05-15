import { useState } from "react";
import { motion } from "framer-motion";
import { Search, RefreshCw, Plus } from "lucide-react";
import { AutomationStatus, AutomationJob } from "@/components/admin/AutomationStatus";
import { AreaChartWidget } from "@/components/admin/AnalyticsChart";

const mockJobs: AutomationJob[] = [
  { id: 1,  name: "Daily Digest Mailer",       type: "Email",     status: "active", lastRun: "5m ago",  nextRun: "23h 55m", runs: 1240, failures: 2 },
  { id: 2,  name: "Overdue Task Reminder",     type: "Reminder",  status: "active", lastRun: "1h ago",  nextRun: "23h",     runs: 8820, failures: 12 },
  { id: 3,  name: "Lead Score Recalculator",   type: "AI",        status: "active", lastRun: "30m ago", nextRun: "30m",     runs: 4400, failures: 0 },
  { id: 4,  name: "Recurring Task Generator",  type: "Scheduler", status: "failed", lastRun: "2h ago",  nextRun: "—",       runs: 3210, failures: 48 },
  { id: 5,  name: "Push Notification Queue",   type: "Push",      status: "active", lastRun: "2m ago",  nextRun: "8m",      runs: 22100,failures: 5 },
  { id: 6,  name: "AI Task Parser",            type: "AI",        status: "active", lastRun: "1m ago",  nextRun: "1m",      runs: 18400,failures: 3 },
  { id: 7,  name: "Workspace Storage Audit",   type: "Cron",      status: "queued", lastRun: "1d ago",  nextRun: "12h",     runs: 180,  failures: 0 },
  { id: 8,  name: "Stripe Webhook Processor",  type: "Webhook",   status: "active", lastRun: "10m ago", nextRun: "—",       runs: 9900, failures: 1 },
  { id: 9,  name: "Inactivity Nudge Engine",   type: "Reminder",  status: "paused", lastRun: "3d ago",  nextRun: "—",       runs: 440,  failures: 0 },
  { id: 10, name: "Smart Scheduling Engine",   type: "AI",        status: "failed", lastRun: "4h ago",  nextRun: "—",       runs: 2100, failures: 22 },
];

const runHistory = [
  { label: "Mon", runs: 4200 }, { label: "Tue", runs: 5100 }, { label: "Wed", runs: 4800 },
  { label: "Thu", runs: 5600 }, { label: "Fri", runs: 6200 }, { label: "Sat", runs: 3100 }, { label: "Sun", runs: 2400 },
];

const statusFilters = ["All", "active", "failed", "queued", "paused"];

export default function AdminAutomations() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = mockJobs.filter(j =>
    (filter === "All" || j.status === filter) &&
    j.name.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    active:  mockJobs.filter(j => j.status === "active").length,
    failed:  mockJobs.filter(j => j.status === "failed").length,
    queued:  mockJobs.filter(j => j.status === "queued").length,
    paused:  mockJobs.filter(j => j.status === "paused").length,
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Jobs",   value: counts.active,  color: "text-emerald-600 bg-emerald-50" },
          { label: "Failed Jobs",   value: counts.failed,  color: "text-red-500 bg-red-50" },
          { label: "Queued",        value: counts.queued,  color: "text-amber-600 bg-amber-50" },
          { label: "Paused",        value: counts.paused,  color: "text-gray-500 bg-gray-100" },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-[#f0f0f0] px-4 py-3 shadow-sm">
            <p className="text-[11px] text-[#888] uppercase tracking-wider">{label}</p>
            <p className={`text-[24px] font-semibold mt-1 ${color.split(" ")[0]}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Jobs list */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-[#f0f0f0] shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f0f0f0]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#aaa]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…"
                className="w-full h-8 pl-8 pr-3 text-[13px] bg-[#f5f5f5] rounded-lg border border-transparent focus:outline-none focus:border-[#e0e0e0] focus:bg-white transition-all placeholder:text-[#bbb]" />
            </div>
            <div className="flex gap-1">
              {statusFilters.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`h-7 px-2.5 text-[11px] font-medium rounded-lg capitalize transition-colors ${filter === f ? "bg-[#0f0f0f] text-white" : "bg-[#f5f5f5] text-[#555] hover:bg-[#ebebeb]"}`}>
                  {f}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-white bg-[#0f0f0f] rounded-lg hover:bg-[#333] transition-colors shrink-0">
              <Plus className="size-3.5" /> New Job
            </button>
          </div>
          <div className="p-4">
            <AutomationStatus jobs={filtered} />
          </div>
        </motion.div>

        {/* Run history */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-[#0f0f0f]">Run History</h3>
            <button className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#aaa] hover:text-[#555] transition-colors">
              <RefreshCw className="size-3.5" />
            </button>
          </div>
          <AreaChartWidget data={runHistory} dataKey="runs" color="#f59e0b" height={180} />
          <div className="mt-4 pt-3 border-t border-[#f5f5f5] grid grid-cols-2 gap-3">
            <div className="bg-[#fafafa] rounded-xl p-3">
              <p className="text-[11px] text-[#888]">Total runs (7d)</p>
              <p className="text-[18px] font-semibold text-[#0f0f0f] mt-0.5">31,400</p>
            </div>
            <div className="bg-[#fafafa] rounded-xl p-3">
              <p className="text-[11px] text-[#888]">Success rate</p>
              <p className="text-[18px] font-semibold text-emerald-600 mt-0.5">99.1%</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
