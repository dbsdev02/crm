import { useState } from "react";
import { Search, Bell, ChevronDown, Shield, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const mockAlerts = [
  { id: 1, title: "Failed automation job", desc: "Reminder engine failed for 3 tasks", time: "2m ago", dot: "bg-red-500" },
  { id: 2, title: "New organization signup", desc: "Acme Corp joined on Pro plan", time: "14m ago", dot: "bg-emerald-500" },
  { id: 3, title: "Subscription upgraded", desc: "Fieldscale → Enterprise", time: "1h ago", dot: "bg-blue-500" },
];

export function AdminHeader({ title }: { title: string }) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[#f0f0f0] bg-white/80 backdrop-blur-sm shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold text-[#0f0f0f] tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 size-3.5 text-[#aaa]" />
          <input
            placeholder="Search anything…"
            className="h-8 pl-8 pr-4 text-[13px] bg-[#f5f5f5] border border-transparent rounded-lg w-52 focus:outline-none focus:border-[#e0e0e0] focus:bg-white transition-all placeholder:text-[#bbb]"
          />
          <kbd className="absolute right-2.5 text-[10px] text-[#ccc] font-mono">⌘K</kbd>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-lg hover:bg-[#f5f5f5] text-[#777] transition-colors"
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#db4035]" />
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 w-80 bg-white rounded-xl border border-[#e8e8e8] shadow-xl shadow-black/8 z-50"
              >
                <div className="px-4 py-3 border-b border-[#f0f0f0] flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#0f0f0f]">System Alerts</span>
                  <span className="text-[11px] text-[#db4035] font-medium">3 new</span>
                </div>
                {mockAlerts.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors border-b border-[#f5f5f5] last:border-0 cursor-pointer">
                    <span className={`size-2 rounded-full mt-1.5 shrink-0 ${a.dot}`} />
                    <div>
                      <p className="text-[13px] font-medium text-[#0f0f0f]">{a.title}</p>
                      <p className="text-[12px] text-[#888] mt-0.5">{a.desc}</p>
                      <p className="text-[11px] text-[#bbb] mt-1">{a.time}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors"
          >
            <div className="size-6 rounded-full bg-gradient-to-br from-[#db4035] to-[#e8534a] grid place-items-center text-white text-[10px] font-bold">
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <span className="text-[13px] font-medium text-[#333] hidden sm:block">{user?.name}</span>
            <ChevronDown className="size-3 text-[#aaa]" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 w-52 bg-white rounded-xl border border-[#e8e8e8] shadow-xl shadow-black/8 z-50 py-1.5"
              >
                <div className="px-3 py-2 border-b border-[#f0f0f0] mb-1">
                  <p className="text-[13px] font-semibold text-[#0f0f0f]">{user?.name}</p>
                  <p className="text-[11px] text-[#888]">{user?.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-[#db4035] bg-[#fef2f2] px-1.5 py-0.5 rounded-full">
                    <Shield className="size-2.5" /> Super Admin
                  </span>
                </div>
                <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#555] hover:bg-[#f5f5f5] transition-colors">
                  <ExternalLink className="size-3.5" /> Back to App
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside */}
      {(notifOpen || profileOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setNotifOpen(false); setProfileOpen(false); }} />
      )}
    </header>
  );
}
