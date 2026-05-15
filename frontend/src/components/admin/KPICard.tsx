import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  index?: number;
}

export function KPICard({ title, value, change, trend = "neutral", icon: Icon, iconColor = "text-[#db4035]", iconBg = "bg-[#fef2f2]", index = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-white rounded-2xl border border-[#f0f0f0] p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-[#888] uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-[28px] font-semibold text-[#0f0f0f] tracking-tight leading-none">{value}</p>
          {change && (
            <div className={cn(
              "mt-2 flex items-center gap-1 text-[12px] font-medium",
              trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-[#888]"
            )}>
              {trend === "up" && <TrendingUp className="size-3" />}
              {trend === "down" && <TrendingDown className="size-3" />}
              {change}
            </div>
          )}
        </div>
        <div className={cn("size-10 rounded-xl grid place-items-center shrink-0", iconBg)}>
          <Icon className={cn("size-5", iconColor)} />
        </div>
      </div>
    </motion.div>
  );
}
