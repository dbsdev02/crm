import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bot, Brain, Clock, Lightbulb, Repeat, Bell, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AISetting {
  id: string; label: string; desc: string; icon: React.ElementType;
  iconColor: string; iconBg: string; enabled: boolean; beta?: boolean;
}

const initialSettings: AISetting[] = [
  { id: "nlp_parser",       label: "NLP Task Parser",           desc: "Automatically parse natural language into structured tasks with due dates, priorities and labels.", icon: Brain,     iconColor: "text-purple-600", iconBg: "bg-purple-50",  enabled: true },
  { id: "smart_schedule",   label: "Smart Scheduling",          desc: "AI suggests optimal time slots for tasks based on user patterns and calendar availability.",         icon: Clock,     iconColor: "text-blue-600",   iconBg: "bg-blue-50",    enabled: true },
  { id: "recurring_engine", label: "Recurring Task Engine",     desc: "Automatically generate recurring tasks based on templates and user-defined schedules.",              icon: Repeat,    iconColor: "text-emerald-600",iconBg: "bg-emerald-50", enabled: true },
  { id: "ai_suggestions",   label: "AI Task Suggestions",       desc: "Proactively suggest tasks based on project context, past behavior and team activity.",               icon: Lightbulb, iconColor: "text-amber-600",  iconBg: "bg-amber-50",   enabled: false, beta: true },
  { id: "smart_reminders",  label: "Smart Reminders",           desc: "Adaptive reminder timing that learns from user response patterns to reduce notification fatigue.",   icon: Bell,      iconColor: "text-indigo-600", iconBg: "bg-indigo-50",  enabled: true },
  { id: "overdue_nudge",    label: "Overdue Suggestions",       desc: "AI identifies overdue tasks and suggests reschedule options or delegation to team members.",         icon: Zap,       iconColor: "text-red-500",    iconBg: "bg-red-50",     enabled: true },
  { id: "auto_labels",      label: "Auto-labeling",             desc: "Automatically assign labels and categories to tasks based on content and project context.",          icon: Sparkles,  iconColor: "text-teal-600",   iconBg: "bg-teal-50",    enabled: false, beta: true },
  { id: "ai_summary",       label: "AI Activity Summaries",     desc: "Generate daily and weekly productivity summaries for users and team managers.",                      icon: Bot,       iconColor: "text-[#db4035]",  iconBg: "bg-[#fef2f2]",  enabled: true },
];

export default function AdminAISettings() {
  const { toast } = useToast();
  const { data: dbSettings = {} } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.get<Record<string, string>>("/admin/settings"),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, string>) => api.put("/admin/settings", payload),
    onSuccess: () => toast({ title: "AI settings saved" }),
  });

  const [settings, setSettings] = useState(initialSettings);

  // Sync from DB once loaded
  useEffect(() => {
    if (Object.keys(dbSettings).length) {
      setSettings(prev => prev.map(s => ({
        ...s,
        enabled: dbSettings[`ai_${s.id}`] !== undefined ? dbSettings[`ai_${s.id}`] === "true" : s.enabled,
      })));
    }
  }, [dbSettings]);

  const toggle = (id: string) => {
    setSettings(prev => {
      const next = prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
      const payload = Object.fromEntries(next.map(s => [`ai_${s.id}`, String(s.enabled)]));
      saveMutation.mutate(payload);
      return next;
    });
  };

  const enabled = settings.filter(s => s.enabled).length;

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#0f0f0f] to-[#1a1a1a] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-xl bg-white/10 grid place-items-center">
            <Bot className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold">AI & Automation Engine</h2>
            <p className="text-[13px] text-white/60">Manage intelligence features across all workspaces</p>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4">
          <div>
            <p className="text-[24px] font-semibold">{enabled}/{settings.length}</p>
            <p className="text-[12px] text-white/50">Features active</p>
          </div>
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(enabled / settings.length) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-[#db4035] to-[#e8534a] rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* Settings grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {settings.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={cn(
              "bg-white rounded-2xl border p-5 shadow-sm transition-all",
              s.enabled ? "border-[#f0f0f0]" : "border-[#f5f5f5] opacity-70"
            )}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={cn("size-10 rounded-xl grid place-items-center shrink-0", s.iconBg)}>
                  <s.icon className={cn("size-5", s.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-[#0f0f0f]">{s.label}</p>
                    {s.beta && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-purple-600 bg-purple-50">Beta</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#888] mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
              <button onClick={() => toggle(s.id)}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5",
                  s.enabled ? "bg-[#0f0f0f]" : "bg-[#e0e0e0]"
                )}>
                <motion.span
                  animate={{ x: s.enabled ? 22 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 size-4 rounded-full bg-white shadow-sm"
                />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
