import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Smartphone, Zap, CheckCircle2, XCircle, RefreshCw, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotifType {
  id: string; label: string; desc: string; channel: "email" | "push" | "in-app";
  enabled: boolean; lastSent: string; delivered: number; failed: number;
}

const initialTypes: NotifType[] = [
  { id: "task_due",       label: "Task Due Reminder",       desc: "Sent 1h before task deadline",          channel: "push",   enabled: true,  lastSent: "2m ago",  delivered: 8820, failed: 12 },
  { id: "task_overdue",   label: "Overdue Task Alert",      desc: "Sent when task passes due date",        channel: "push",   enabled: true,  lastSent: "5m ago",  delivered: 3120, failed: 8 },
  { id: "daily_digest",   label: "Daily Digest Email",      desc: "Morning summary of tasks & activity",   channel: "email",  enabled: true,  lastSent: "6h ago",  delivered: 2240, failed: 3 },
  { id: "weekly_report",  label: "Weekly Report",           desc: "Productivity summary every Monday",     channel: "email",  enabled: true,  lastSent: "3d ago",  delivered: 1840, failed: 1 },
  { id: "mention_alert",  label: "Mention Notification",    desc: "When user is @mentioned in a comment",  channel: "in-app", enabled: true,  lastSent: "12m ago", delivered: 5600, failed: 0 },
  { id: "billing_alert",  label: "Billing Alert",           desc: "Payment success / failure notifications",channel: "email",  enabled: true,  lastSent: "1d ago",  delivered: 298,  failed: 2 },
  { id: "automation_fail",label: "Automation Failure Alert",desc: "When a scheduled job fails",            channel: "in-app", enabled: true,  lastSent: "2h ago",  delivered: 44,   failed: 0 },
  { id: "new_member",     label: "New Member Welcome",      desc: "Onboarding email for new users",        channel: "email",  enabled: false, lastSent: "Never",   delivered: 0,    failed: 0 },
];

const channelIcon = { email: Mail, push: Smartphone, "in-app": Bell };
const channelColor = { email: "text-blue-600 bg-blue-50", push: "text-purple-600 bg-purple-50", "in-app": "text-amber-600 bg-amber-50" };

export default function AdminNotifications() {
  const [types, setTypes] = useState(initialTypes);

  const toggle = (id: string) => setTypes(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Sent (7d)",  value: "42,180", icon: Send,         color: "text-blue-600 bg-blue-50" },
          { label: "Delivered",        value: "41,962", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Failed",           value: "218",    icon: XCircle,      color: "text-red-500 bg-red-50" },
          { label: "Active Channels",  value: "3",      icon: Zap,          color: "text-amber-600 bg-amber-50" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-[#f0f0f0] px-4 py-3 shadow-sm flex items-center gap-3">
            <div className={`size-9 rounded-xl grid place-items-center shrink-0 ${color}`}>
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-[11px] text-[#888] uppercase tracking-wider">{label}</p>
              <p className="text-[20px] font-semibold text-[#0f0f0f]">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Notification types */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0f0f0]">
          <h3 className="text-[14px] font-semibold text-[#0f0f0f]">Notification Types</h3>
          <p className="text-[12px] text-[#888] mt-0.5">Enable or disable notification channels and monitor delivery</p>
        </div>
        <div className="divide-y divide-[#f5f5f5]">
          {types.map((t, i) => {
            const Icon = channelIcon[t.channel];
            return (
              <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[#fafafa] transition-colors">
                <div className={cn("size-9 rounded-xl grid place-items-center shrink-0", channelColor[t.channel])}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-[#0f0f0f]">{t.label}</p>
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize", channelColor[t.channel])}>{t.channel}</span>
                  </div>
                  <p className="text-[12px] text-[#888] mt-0.5">{t.desc}</p>
                </div>
                <div className="hidden md:flex items-center gap-6 text-[12px] text-[#888]">
                  <div className="text-center">
                    <p className="font-semibold text-[#0f0f0f]">{t.delivered.toLocaleString()}</p>
                    <p className="text-[10px]">Delivered</p>
                  </div>
                  <div className="text-center">
                    <p className={cn("font-semibold", t.failed > 0 ? "text-red-500" : "text-[#0f0f0f]")}>{t.failed}</p>
                    <p className="text-[10px]">Failed</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-[#555]">{t.lastSent}</p>
                    <p className="text-[10px]">Last sent</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="p-1.5 rounded-lg hover:bg-[#f0f0f0] text-[#aaa] hover:text-[#555] transition-colors">
                    <RefreshCw className="size-3.5" />
                  </button>
                  <button onClick={() => toggle(t.id)}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-colors",
                      t.enabled ? "bg-[#0f0f0f]" : "bg-[#e0e0e0]"
                    )}>
                    <motion.span
                      animate={{ x: t.enabled ? 22 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-0.5 size-4 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
