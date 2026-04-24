import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, CheckSquare, FolderOpen, Calendar, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Target, Users, Award, Share2, Search, Settings, Activity, Contact, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";

const mainTabs = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Tasks", path: "/tasks", icon: CheckSquare },
  { label: "Projects", path: "/projects", icon: FolderOpen },
  { label: "Calendar", path: "/calendar", icon: Calendar },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const moreLinks = [
    { title: "Leads", url: "/leads", icon: Target, roles: ["admin", "staff"] },
    { title: "Customers", url: "/customers", icon: Contact, roles: ["admin", "staff"] },
    { title: "Credits", url: "/credits", icon: Award, roles: ["admin", "staff"] },
    { title: "Social Media", url: "/social-media", icon: Share2, roles: ["admin", "staff"] },
    { title: "SEO Activities", url: "/seo", icon: Search, roles: ["admin", "staff"] },
    { title: "Staff", url: "/staff", icon: Users, roles: ["admin"] },
    { title: "Logs", url: "/logs", icon: Activity, roles: ["admin"] },
    { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] },
  ].filter((l) => user && l.roles.includes(user.role));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex md:hidden safe-bottom">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span>{tab.label}</span>
              {active && <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-t-full" />}
            </button>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] text-muted-foreground"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left">More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 pb-4">
            {moreLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.url}
                  onClick={() => { navigate(link.url); setMoreOpen(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs text-center">{link.title}</span>
                </button>
              );
            })}
          </div>
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive mt-2"
            onClick={() => { logout(); navigate("/login"); }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
};
