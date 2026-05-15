import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  LayoutDashboard, Users, Target, CheckSquare, FolderOpen, Inbox,
  Calendar, FileText, Award, Share2, Search, Settings, LogOut, Activity, Contact, Plus, X, ChevronRight, CalendarDays,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLabels } from "@/contexts/LabelsContext";
import { useProjects } from "@/hooks/useProjects";
import { useState } from "react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupAction, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: string[];
}

const taskViews: NavItem[] = [
  { title: "Inbox",    url: "/tasks?view=inbox",    icon: Inbox,        roles: ["admin", "staff", "user"] },
  { title: "Today",    url: "/tasks?view=today",    icon: CalendarDays, roles: ["admin", "staff", "user"] },
  { title: "Upcoming", url: "/tasks?view=upcoming", icon: Calendar,     roles: ["admin", "staff", "user"] },
];

const mainNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "staff", "user"] },
  { title: "Leads",     url: "/leads",    icon: Target,          roles: ["super_admin", "admin", "staff"] },
  { title: "Customers", url: "/customers",icon: Contact,         roles: ["super_admin", "admin", "staff"] },
  { title: "Projects",  url: "/projects", icon: FolderOpen,      roles: ["super_admin", "admin", "staff", "user"] },
  { title: "Calendar",  url: "/calendar", icon: Calendar,        roles: ["super_admin", "admin", "staff", "user"] },
];

const adminNav: NavItem[] = [
  { title: "Staff Management", url: "/staff", icon: Users, roles: ["super_admin", "admin"] },
  { title: "Logs", url: "/logs", icon: Activity, roles: ["super_admin", "admin"] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ["super_admin", "admin"] },
];

const extraNav: NavItem[] = [
  { title: "Social Media", url: "/social-media", icon: Share2, roles: ["super_admin", "admin", "staff"] },
  { title: "SEO Activities", url: "/seo", icon: Search, roles: ["super_admin", "admin", "staff"] },
  { title: "Credits", url: "/credits", icon: Award, roles: ["super_admin", "admin", "staff"] },
  { title: "Reports", url: "/reports", icon: FileText, roles: ["super_admin", "admin", "staff"] },
];

const LABEL_COLORS = [
  { name: "Red", value: "bg-red-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Slate", value: "bg-slate-500" },
  { name: "Cyan", value: "bg-cyan-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Pink", value: "bg-pink-500" },
];

const LABEL_DOTS: Record<string, string> = {
  bug: "bg-red-500",
  feature: "bg-blue-500",
  design: "bg-purple-500",
  urgent: "bg-orange-500",
  review: "bg-yellow-500",
  backend: "bg-slate-500",
  frontend: "bg-cyan-500",
};
const labelDot = (l: string) => LABEL_DOTS[l.toLowerCase()] ?? "bg-gray-400";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout } = useAuth();
  const { labels, addLabel, removeLabel, activeFilter, setActiveFilter } = useLabels();
  const { projects } = useProjects();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [addLabelOpen, setAddLabelOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0].value);
  const [addToFavorites, setAddToFavorites] = useState(false);
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
            end={item.url === "/dashboard"}
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

        {/* Task views — Todoist style */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[11px] uppercase tracking-wider">Tasks</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterByRole(taskViews).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent text-[13px]"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Main navigation — without Projects (shown separately below) */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[11px] uppercase tracking-wider">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(filterByRole(mainNav))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects — Todoist style with color dots */}
        {!collapsed && (
          <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen} className="group/projects">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-sidebar-accent rounded-md px-2">
                  <span className="text-[11px] uppercase tracking-wider text-sidebar-foreground/50">Projects</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); navigate("/projects"); }}
                      className="flex items-center justify-center rounded-md hover:bg-sidebar-accent p-0.5"
                      title="All projects"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]/projects:rotate-90" />
                  </div>
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {projects.slice(0, 10).map((p) => (
                      <SidebarMenuItem key={p.id}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={`/projects/${p.id}`}
                            className="hover:bg-sidebar-accent text-[13px]"
                            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0 mr-2"
                              style={{ backgroundColor: p.color || "#4073ff" }}
                            />
                            <span className="truncate">{p.name}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to="/projects"
                          className="hover:bg-sidebar-accent text-[12px] text-sidebar-foreground/50"
                          activeClassName=""
                        >
                          <FolderOpen className="mr-2 h-3.5 w-3.5 shrink-0" />
                          <span>All projects</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* Filters & Labels */}
        {!collapsed && (
          <Collapsible open={labelsOpen} onOpenChange={setLabelsOpen} className="group/labels">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-sidebar-accent rounded-md px-2">
                  <span>Filters & Labels</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); setAddLabelOpen(true); }}
                      className="flex items-center justify-center rounded-md hover:bg-sidebar-accent p-0.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]/labels:rotate-90" />
                  </div>
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {labels.map((l) => (
                      <SidebarMenuItem key={l}>
                        <SidebarMenuButton
                          isActive={activeFilter === l}
                          onClick={() => setActiveFilter(activeFilter === l ? null : l)}
                        >
                          <span className={cn("h-2 w-2 rounded-full shrink-0", labelDot(l))} />
                          <span>{l}</span>
                        </SidebarMenuButton>
                        <SidebarMenuAction showOnHover onClick={() => removeLabel(l)} title="Remove">
                          <X />
                        </SidebarMenuAction>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

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
                <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                  {user.role === "super_admin" ? "⚡ Super Admin" : user.role}
                </p>
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

      <Dialog open={addLabelOpen} onOpenChange={setAddLabelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add label</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                maxLength={60}
                placeholder="Enter label name"
              />
              <div className="text-xs text-muted-foreground text-right">{newLabelName.length}/60</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select value={newLabelColor} onValueChange={setNewLabelColor}>
                <SelectTrigger id="color">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-3 w-3 rounded-full", newLabelColor)} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {LABEL_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <span className={cn("h-3 w-3 rounded-full", color.value)} />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="favorites">Add to favorites</Label>
              <Switch id="favorites" checked={addToFavorites} onCheckedChange={setAddToFavorites} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLabelOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (newLabelName.trim()) {
                  addLabel(newLabelName.trim());
                  setNewLabelName("");
                  setNewLabelColor(LABEL_COLORS[0].value);
                  setAddToFavorites(false);
                  setAddLabelOpen(false);
                }
              }}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
