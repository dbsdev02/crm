import {
  LayoutDashboard, Users, Target, CheckSquare, FolderOpen,
  Calendar, FileText, Award, Share2, Search, Settings, LogOut, Activity, Contact,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: string[];
}

const mainNav: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["admin", "staff", "user"] },
  { title: "Leads", url: "/leads", icon: Target, roles: ["admin", "staff"] },
  { title: "Customers", url: "/customers", icon: Contact, roles: ["admin", "staff"] },
  { title: "Tasks", url: "/tasks", icon: CheckSquare, roles: ["admin", "staff", "user"] },
  { title: "Projects", url: "/projects", icon: FolderOpen, roles: ["admin", "staff", "user"] },
  { title: "Calendar", url: "/calendar", icon: Calendar, roles: ["admin", "staff", "user"] },
];

const adminNav: NavItem[] = [
  { title: "Staff Management", url: "/staff", icon: Users, roles: ["admin"] },
  { title: "Logs", url: "/logs", icon: Activity, roles: ["admin"] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] },
];

const extraNav: NavItem[] = [
  { title: "Social Media", url: "/social-media", icon: Share2, roles: ["admin", "staff"] },
  { title: "SEO Activities", url: "/seo", icon: Search, roles: ["admin", "staff"] },
  { title: "Credits", url: "/credits", icon: Award, roles: ["admin", "staff"] },
  { title: "Reports", url: "/reports", icon: FileText, roles: ["admin", "staff"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filterByRole = (items: NavItem[]) =>
    items.filter((i) => user && i.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="hover:bg-sidebar-accent"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          >
            <item.icon className="mr-2 h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold">
            C
          </div>
          {!collapsed && <span className="text-lg font-bold text-sidebar-foreground">CRM</span>}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(filterByRole(mainNav))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Extra modules */}
        {filterByRole(extraNav).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60">Modules</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(filterByRole(extraNav))}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin navigation */}
        {filterByRole(adminNav).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(filterByRole(adminNav))}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* User info + logout at bottom */}
        <div className="mt-auto p-3 border-t border-sidebar-border">
          {!collapsed && user && (
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{user.role}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
