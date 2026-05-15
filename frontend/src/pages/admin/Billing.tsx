import { motion } from "framer-motion";
import { CreditCard, TrendingUp, Users, ArrowUpRight, Download, CheckCircle2, Clock, XCircle } from "lucide-react";
import { AreaChartWidget, BarChartWidget } from "@/components/admin/AnalyticsChart";

const mrrData = [
  { label: "Jan", mrr: 320000 }, { label: "Feb", mrr: 410000 }, { label: "Mar", mrr: 490000 },
  { label: "Apr", mrr: 560000 }, { label: "May", mrr: 720000 }, { label: "Jun", mrr: 840000 },
];

const planDist = [
  { label: "Enterprise", users: 42 }, { label: "Professional", users: 158 },
  { label: "Starter", users: 98 }, { label: "Free", users: 44 },
];

const invoices = [
  { id: "INV-2024-0891", org: "Acme Corp",     plan: "Enterprise",   amount: "₹24,000", status: "paid",    date: "Jun 1, 2024" },
  { id: "INV-2024-0890", org: "Vector Labs",   plan: "Enterprise",   amount: "₹18,000", status: "paid",    date: "Jun 1, 2024" },
  { id: "INV-2024-0889", org: "Northwind",     plan: "Professional", amount: "₹4,998",  status: "paid",    date: "Jun 1, 2024" },
  { id: "INV-2024-0888", org: "Fieldscale",    plan: "Professional", amount: "₹2,499",  status: "paid",    date: "Jun 1, 2024" },
  { id: "INV-2024-0887", org: "Loophaus",      plan: "Starter",      amount: "₹999",    status: "pending", date: "Jun 1, 2024" },
  { id: "INV-2024-0886", org: "Brightline",    plan: "Starter",      amount: "₹999",    status: "failed",  date: "May 28, 2024" },
];

const statusIcon = { paid: CheckCircle2, pending: Clock, failed: XCircle };
const statusColor = { paid: "text-emerald-600 bg-emerald-50", pending: "text-amber-600 bg-amber-50", failed: "text-red-500 bg-red-50" };

export default function AdminBilling() {
  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Monthly Revenue",  value: "₹8,40,000", change: "+18% MoM",    icon: CreditCard,  color: "text-[#db4035] bg-[#fef2f2]" },
          { label: "Annual Run Rate",  value: "₹1.01Cr",   change: "Projected",   icon: TrendingUp,  color: "text-emerald-600 bg-emerald-50" },
          { label: "Paying Orgs",      value: "298",        change: "+12 this mo", icon: Users,       color: "text-blue-600 bg-blue-50" },
          { label: "Avg Revenue/Org",  value: "₹2,819",    change: "Per month",   icon: ArrowUpRight,color: "text-purple-600 bg-purple-50" },
        ].map(({ label, value, change, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-[#888] uppercase tracking-wider">{label}</p>
                <p className="mt-2 text-[26px] font-semibold text-[#0f0f0f] tracking-tight">{value}</p>
                <p className="mt-1 text-[12px] text-[#888]">{change}</p>
              </div>
              <div className={`size-10 rounded-xl grid place-items-center ${color}`}>
                <Icon className="size-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm">
          <h3 className="text-[14px] font-semibold text-[#0f0f0f] mb-1">MRR Growth</h3>
          <p className="text-[12px] text-[#888] mb-4">Monthly recurring revenue trend</p>
          <AreaChartWidget data={mrrData} dataKey="mrr" color="#db4035" height={180} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm">
          <h3 className="text-[14px] font-semibold text-[#0f0f0f] mb-1">Plan Distribution</h3>
          <p className="text-[12px] text-[#888] mb-4">Organizations by subscription tier</p>
          <BarChartWidget data={planDist} dataKey="users" color="#6366f1" height={180} />
        </motion.div>
      </div>

      {/* Invoices */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
          <h3 className="text-[14px] font-semibold text-[#0f0f0f]">Recent Invoices</h3>
          <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-[#555] bg-[#f5f5f5] rounded-lg hover:bg-[#ebebeb] transition-colors">
            <Download className="size-3.5" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                {["Invoice", "Organization", "Plan", "Amount", "Status", "Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => {
                const Icon = statusIcon[inv.status as keyof typeof statusIcon];
                return (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-[#f8f8f8] hover:bg-[#fafafa] transition-colors">
                    <td className="px-4 py-3 font-mono text-[12px] text-[#888]">{inv.id}</td>
                    <td className="px-4 py-3 font-medium text-[#0f0f0f]">{inv.org}</td>
                    <td className="px-4 py-3 text-[#555]">{inv.plan}</td>
                    <td className="px-4 py-3 font-semibold text-[#0f0f0f]">{inv.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColor[inv.status as keyof typeof statusColor]}`}>
                        <Icon className="size-3" /> {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#aaa]">{inv.date}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
