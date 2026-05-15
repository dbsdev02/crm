import { Outlet, useLocation, Navigate } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { AdminHeader } from "@/components/admin/Header";
import { useAuth } from "@/contexts/AuthContext";

const titles: Record<string, string> = {
  "/admin":               "Dashboard",
  "/admin/organizations": "Organizations",
  "/admin/users":         "Users",
  "/admin/workspaces":    "Workspaces",
  "/admin/billing":       "Subscription & Billing",
  "/admin/analytics":     "Productivity Analytics",
  "/admin/automations":   "Automation Management",
  "/admin/roles":         "Roles & Permissions",
  "/admin/logs":          "Activity Logs",
  "/admin/notifications": "Notifications",
  "/admin/ai-settings":   "AI & Automation Settings",
  "/admin/settings":      "System Settings",
  "/admin/support":       "Support Center",
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuth();
  const title = titles[pathname] ?? "Super Admin";

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "super_admin") return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex h-screen bg-[#f7f7f7] overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
