import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutomationJob {
  id: number;
  name: string;
  type: string;
  status: "active" | "failed" | "queued" | "paused";
  lastRun: string;
  nextRun?: string;
  runs: number;
  failures: number;
}

const statusConfig = {
  active:  { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "Active" },
  failed:  { icon: XCircle,      color: "text-red-500",     bg: "bg-red-50",     label: "Failed" },
  queued:  { icon: Clock,        color: "text-amber-500",   bg: "bg-amber-50",   label: "Queued" },
  paused:  { icon: RefreshCw,    color: "text-gray-400",    bg: "bg-gray-100",   label: "Paused" },
};

export function AutomationStatus({ jobs }: { jobs: AutomationJob[] }) {
  return (
    <div className="space-y-2">
      {jobs.map((job, i) => {
        const cfg = statusConfig[job.status];
        const Icon = cfg.icon;
        return (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#fafafa] hover:bg-[#f5f5f5] transition-colors"
          >
            <div className={cn("size-8 rounded-lg grid place-items-center shrink-0", cfg.bg)}>
              <Icon className={cn("size-4", cfg.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-[#0f0f0f] truncate">{job.name}</p>
                <span className="text-[10px] text-[#aaa] bg-[#f0f0f0] px-1.5 py-0.5 rounded-full shrink-0">{job.type}</span>
              </div>
              <p className="text-[11px] text-[#aaa] mt-0.5">Last run: {job.lastRun} · {job.runs} runs · {job.failures} failures</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Zap className={cn("size-3", cfg.color)} />
              <span className={cn("text-[11px] font-medium", cfg.color)}>{cfg.label}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
