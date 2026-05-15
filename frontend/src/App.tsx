import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomersProvider } from "@/contexts/CustomersContext";
import { LeadFieldsProvider } from "@/contexts/LeadFieldsContext";
import { LabelsProvider } from "@/contexts/LabelsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import Leads from "@/pages/Leads";
import Tasks from "@/pages/Tasks";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import Customers from "@/pages/Customers";
import StaffManagement from "@/pages/StaffManagement";
import CalendarView from "@/pages/CalendarView";
import Logs from "@/pages/Logs";
import Credits from "@/pages/Credits";
import Settings from "@/pages/Settings";
import PlaceholderPage from "@/pages/PlaceholderPage";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import LandingPage from "@/pages/LandingPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminOrganizations from "@/pages/admin/Organizations";
import AdminWorkspaces from "@/pages/admin/Workspaces";
import AdminBilling from "@/pages/admin/Billing";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminAutomations from "@/pages/admin/Automations";
import AdminRoles from "@/pages/admin/Roles";
import AdminActivityLogs from "@/pages/admin/ActivityLogs";
import AdminNotifications from "@/pages/admin/Notifications";
import AdminAISettings from "@/pages/admin/AISettings";
import AdminSettings from "@/pages/admin/Settings";
import AdminSupport from "@/pages/admin/SupportCenter";

const queryClient = new QueryClient();

const ProtectedLayout = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: ("admin" | "staff" | "user")[] }) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <LeadFieldsProvider>
          <LabelsProvider>
            <CustomersProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/dashboard" element={<ProtectedLayout><Index /></ProtectedLayout>} />
                <Route path="/leads" element={<ProtectedLayout allowedRoles={["super_admin", "admin", "staff"]}><Leads /></ProtectedLayout>} />
                <Route path="/customers" element={<ProtectedLayout allowedRoles={["super_admin", "admin", "staff"]}><Customers /></ProtectedLayout>} />
                <Route path="/tasks" element={<ProtectedLayout><Tasks /></ProtectedLayout>} />
                <Route path="/projects" element={<ProtectedLayout><Projects /></ProtectedLayout>} />
                <Route path="/projects/:id" element={<ProtectedLayout><ProjectDetails /></ProtectedLayout>} />
                <Route path="/calendar" element={<ProtectedLayout><CalendarView /></ProtectedLayout>} />
                <Route path="/staff" element={<ProtectedLayout allowedRoles={["super_admin", "admin"]}><StaffManagement /></ProtectedLayout>} />
                <Route path="/logs" element={<ProtectedLayout allowedRoles={["super_admin", "admin"]}><Logs /></ProtectedLayout>} />
                <Route path="/credits" element={<ProtectedLayout allowedRoles={["super_admin", "admin", "staff"]}><Credits /></ProtectedLayout>} />
                <Route path="/social-media" element={<ProtectedLayout allowedRoles={["super_admin", "admin", "staff"]}><PlaceholderPage title="Social Media Activities" description="Manage client social media calendars" /></ProtectedLayout>} />
                <Route path="/seo" element={<ProtectedLayout allowedRoles={["super_admin", "admin", "staff"]}><PlaceholderPage title="SEO Activities" description="Track SEO plans and performance" /></ProtectedLayout>} />
                <Route path="/reports" element={<ProtectedLayout allowedRoles={["super_admin", "admin", "staff"]}><Reports /></ProtectedLayout>} />
                <Route path="/settings" element={<ProtectedLayout allowedRoles={["super_admin", "admin"]}><Settings /></ProtectedLayout>} />
                {/* Super Admin routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="organizations" element={<AdminOrganizations />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="workspaces" element={<AdminWorkspaces />} />
                  <Route path="billing" element={<AdminBilling />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="automations" element={<AdminAutomations />} />
                  <Route path="roles" element={<AdminRoles />} />
                  <Route path="logs" element={<AdminActivityLogs />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="ai-settings" element={<AdminAISettings />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="support" element={<AdminSupport />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </CustomersProvider>
          </LabelsProvider>
        </LeadFieldsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
