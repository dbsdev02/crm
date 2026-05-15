import { motion } from "framer-motion";
import { Users, HardDrive, Zap, MoreHorizontal, Archive, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Workspace {
  id: number;
  name: string;
  org: string;
  members: number;
  plan: string;
  storage: number;
  storageMax: number;
  automations: number;
  status: "active" | "archived";
}

const planColor: Record<string, string> = {
  Enterprise:   "text-indigo-600 bg-indigo-50",
  Professional: "text-blue-600 bg-blue-50",
  Starter:      "text-gray-600 bg-gray-100",
};

export function WorkspaceCard({ ws, index = 0 }: { ws: Workspace; index?: number }) {
  const storagePercent = Math.round((ws.storage / ws.storageMax) * 100);
  const storageColor = storagePercent > 80 ? "bg-red-400" : storagePercent > 60 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={cn(
        "bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm hover:shadow-md transition-shadow",
        ws.status === "archived" && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-[#db4035] to-[#e8534a] grid place-items-center text-white text-[11px] font-bold">
              {ws.name[0]}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0f0f0f]">{ws.name}</p>
              <p className="text-[11px] text-[#888]">{ws.org}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", planColor[ws.plan] ?? planColor.Starter)}>
            {ws.plan}
          </span>
          <button className="p-1 rounded-lg hover:bg-[#f5f5f5] text-[#bbb] hover:text-[#555] transition-colors">
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: Users, label: "Members", value: ws.members },
          { icon: Zap,   label: "Automations", value: ws.automations },
          { icon: HardDrive, label: "Storage", value: `${ws.storage}GB` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-[#fafafa] rounded-xl p-2.5 text-center">
            <Icon className="size-3.5 text-[#aaa] mx-auto mb-1" />
            <p className="text-[13px] font-semibold text-[#0f0f0f]">{value}</p>
            <p className="text-[10px] text-[#bbb]">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-[#888]">Storage usage</span>
          <span className="text-[11px] font-medium text-[#555]">{storagePercent}%</span>
        </div>
        <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${storagePercent}%` }}
            transition={{ duration: 0.6, delay: index * 0.04 + 0.2 }}
            className={cn("h-full rounded-full", storageColor)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f5f5f5]">
        <button className="flex items-center gap-1.5 text-[12px] text-[#888] hover:text-[#0f0f0f] transition-colors">
          <ExternalLink className="size-3" /> View
        </button>
        <button className="flex items-center gap-1.5 text-[12px] text-[#888] hover:text-red-500 transition-colors ml-auto">
          <Archive className="size-3" /> Archive
        </button>
      </div>
    </motion.div>
  );
}
