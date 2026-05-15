import { useLocation, useNavigate } from "react-router-dom";
import { Inbox, CalendarDays, Calendar, FolderOpen, MoreHorizontal, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Target, Users, Award, Share2, Search, Settings, Activity, Contact } from "lucide-react";
import { Button } from "@/components/ui/button";

const mainTabs = [
  { label: "Inbox",    path: "/tasks?view=inbox",    icon: Inbox },
  { label: "Today",    path: "/tasks?view=today",    icon: CalendarDays },
  { label: "Upcoming", path: "/tasks?view=upcoming", icon: Calendar },
  { label: "Projects", path: "/projects",            icon: FolderOpen },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const fullPath = location.pathname + location.search;

  const isActive = (path: string) => {
    if (path.includes("?")) return fullPath.startsWith(path.split("?")[0]) && fullPath.includes(path.split("?")[1]);
    return location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
  };

  const moreLinks = [
    { title: "Dashboard",  url: "/dashboard",    icon: MoreHorizontal, roles: ["admin", "staff", "user", "super_admin"] },
    { title: "Leads",      url: "/leads",         icon: Target,         roles: ["admin", "staff"] },
    { title: "Customers",  url: "/customers",     icon: Contact,        roles: ["admin", "staff"] },
    { title: "Calendar",   url: "/calendar",      icon: Calendar,       roles: ["admin", "staff", "user"] },
    { title: "Credits",    url: "/credits",       icon: Award,          roles: ["admin", "staff"] },
    { title: "Social",     url: "/social-media",  icon: Share2,         roles: ["admin", "staff"] },
    { title: "SEO",        url: "/seo",           icon: Search,         roles: ["admin", "staff"] },
    { title: "Staff",      url: "/staff",         icon: Users,          roles: ["admin"] },
    { title: "Logs",       url: "/logs",          icon: Activity,       roles: ["admin"] },
    { title: "Settings",   url: "/settings",      icon: Settings,       roles: ["admin"] },
  ].filter((l) => user && l.roles.includes(user.role));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#e5e5e5] flex md:hidden">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors relative",
                active ? "text-[#db4035]" : "text-[#aaa]"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-all", active && "stroke-[2.5]")} />
              <span>{tab.label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#db4035] rounded-b-full" />
              )}
            </button>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium text-[#aaa]"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] bg-white">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left text-[16px] font-semibold text-[#202020]">More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-2 pb-4">
            {moreLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.url}
                  onClick={() => { navigate(link.url); setMoreOpen(false); }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#f7f7f7] hover:bg-[#f0f0f0] transition-colors"
                >
                  <Icon className="h-5 w-5 text-[#555]" />
                  <span className="text-[11px] text-[#555] text-center leading-tight">{link.title}</span>
                </button>
              );
            })}
          </div>
          <Button
            variant="ghost"
            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 mt-1 rounded-xl"
            onClick={() => { logout(); navigate("/login"); }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
};
