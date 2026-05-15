import { motion } from "framer-motion";
import { Building2, User, Zap, CreditCard, FolderKanban, Trash2, Settings } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  org: Building2, user: User, automation: Zap, billing: CreditCard,
  project: FolderKanban, delete: Trash2, settings: Settings,
};

const colorMap: Record<string, string> = {
  org: "bg-blue-50 text-blue-600", user: "bg-purple-50 text-purple-600",
  automation: "bg-amber-50 text-amber-600", billing: "bg-emerald-50 text-emerald-600",
  project: "bg-indigo-50 text-indigo-600", delete: "bg-red-50 text-red-500",
  settings: "bg-gray-100 text-gray-600",
};

export interface ActivityItem {
  id: number;
  type: keyof typeof iconMap;
  actor: string;
  action: string;
  target: string;
  time: string;
}

export const mockActivity: ActivityItem[] = [
  { id: 1,  type: "org",        actor: "System",       action: "New organization joined",  target: "Acme Corp",           time: "2m ago" },
  { id: 2,  type: "automation", actor: "Scheduler",    action: "Automation triggered",     target: "Daily digest #42",    time: "5m ago" },
  { id: 3,  type: "user",       actor: "Sara L.",      action: "User role updated",         target: "→ Workspace Admin",   time: "12m ago" },
  { id: 4,  type: "billing",    actor: "Stripe",       action: "Subscription upgraded",    target: "Fieldscale → Pro",    time: "34m ago" },
  { id: 5,  type: "project",    actor: "Marcus C.",    action: "Project archived",          target: "Q1 Campaign",         time: "1h ago" },
  { id: 6,  type: "automation", actor: "Scheduler",    action: "Failed job retried",        target: "Reminder #88",        time: "1h ago" },
  { id: 7,  type: "user",       actor: "Admin",        action: "User suspended",            target: "john@example.com",    time: "2h ago" },
  { id: 8,  type: "settings",   actor: "Super Admin",  action: "SMTP config updated",       target: "System Settings",     time: "3h ago" },
  { id: 9,  type: "billing",    actor: "Stripe",       action: "Invoice paid",              target: "Loophaus — ₹2,499",   time: "4h ago" },
  { id: 10, type: "delete",     actor: "Admin",        action: "Workspace deleted",         target: "Old Sandbox",         time: "5h ago" },
];

export function ActivityFeed({ items = mockActivity, limit }: { items?: ActivityItem[]; limit?: number }) {
  const list = limit ? items.slice(0, limit) : items;
  return (
    <div className="space-y-0">
      {list.map((item, i) => {
        const Icon = iconMap[item.type] ?? User;
        const color = colorMap[item.type] ?? colorMap.settings;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className="flex items-start gap-3 py-3 border-b border-[#f5f5f5] last:border-0"
          >
            <div className={`size-7 rounded-lg grid place-items-center shrink-0 mt-0.5 ${color}`}>
              <Icon className="size-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#0f0f0f]">
                <span className="font-medium">{item.actor}</span>
                {" · "}
                <span className="text-[#555]">{item.action}</span>
              </p>
              <p className="text-[12px] text-[#888] mt-0.5 truncate">{item.target}</p>
            </div>
            <span className="text-[11px] text-[#bbb] shrink-0 mt-0.5">{item.time}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
