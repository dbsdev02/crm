import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Building2, Users, Briefcase, CreditCard,
  BarChart3, Zap, ShieldCheck, ScrollText, Bell, Bot,
  Settings, LifeBuoy, ChevronLeft, Sparkles, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard",      icon: LayoutDashboard, to: "/admin" },
  { label: "Organizations",  icon: Building2,        to: "/admin/organizations" },
  { label: "Users",          icon: Users,            to: "/admin/users" },
  { label: "Workspaces",     icon: Briefcase,        to: "/admin/workspaces" },
  { label: "Billing",        icon: CreditCard,       to: "/admin/billing" },
  { label: "Analytics",      icon: BarChart3,        to: "/admin/analytics" },
  { label: "Automations",    icon: Zap,              to: "/admin/automations" },
  { label: "Roles",          icon: ShieldCheck,      to: "/admin/roles" },
  { label: "Activity Logs",  icon: ScrollText,       to: "/admin/logs" },
  { label: "Notifications",  icon: Bell,             to: "/admin/notifications" },
  { label: "AI Settings",    icon: Bot,              to: "/admin/ai-settings" },
  { label: "System",         icon: Settings,         to: "/admin/settings" },
  { label: "Support",        icon: LifeBuoy,         to: "/admin/support" },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-full bg-[#0f0f0f] border-r border-white/[0.06] shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-white/[0.06] shrink-0">
        <div className="size-7 rounded-lg bg-gradient-to-br from-[#db4035] to-[#e8534a] grid place-items-center shrink-0 shadow-lg shadow-[#db4035]/30">
          <Sparkles className="size-3.5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="text-[13px] font-semibold text-white tracking-tight whitespace-nowrap"
            >
              Super Admin
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 px-2">
        {nav.map(({ label, icon: Icon, to }) => {
          const active = location.pathname === to || (to !== "/admin" && location.pathname.startsWith(to));
          return (
            <NavLink key={to} to={to} end={to === "/admin"}>
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.12 }}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/80 hover:bg-white/[0.05]"
                )}
              >
                <Icon className={cn("size-4 shrink-0", active ? "text-[#db4035]" : "")} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 space-y-0.5 border-t border-white/[0.06] pt-3">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium text-white/40 hover:text-white/80 hover:bg-white/[0.05] transition-colors w-full"
        >
          <LogOut className="size-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-[52px] -right-3 z-10 size-6 rounded-full bg-[#1a1a1a] border border-white/10 grid place-items-center text-white/40 hover:text-white transition-colors shadow-md"
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronLeft className="size-3" />
        </motion.div>
      </button>
    </motion.aside>
  );
}
