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
import NotFound from "@/pages/NotFound";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

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
                <Route path="/login" element={<Login />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/" element={<ProtectedLayout><Index /></ProtectedLayout>} />
                <Route path="/leads" element={<ProtectedLayout allowedRoles={["admin", "staff"]}><Leads /></ProtectedLayout>} />
                <Route path="/customers" element={<ProtectedLayout allowedRoles={["admin", "staff"]}><Customers /></ProtectedLayout>} />
                <Route path="/tasks" element={<ProtectedLayout><Tasks /></ProtectedLayout>} />
                <Route path="/projects" element={<ProtectedLayout><Projects /></ProtectedLayout>} />
                <Route path="/projects/:id" element={<ProtectedLayout><ProjectDetails /></ProtectedLayout>} />
                <Route path="/calendar" element={<ProtectedLayout><CalendarView /></ProtectedLayout>} />
                <Route path="/staff" element={<ProtectedLayout allowedRoles={["admin"]}><StaffManagement /></ProtectedLayout>} />
                <Route path="/logs" element={<ProtectedLayout allowedRoles={["admin"]}><Logs /></ProtectedLayout>} />
                <Route path="/credits" element={<ProtectedLayout allowedRoles={["admin", "staff"]}><Credits /></ProtectedLayout>} />
                <Route path="/social-media" element={<ProtectedLayout allowedRoles={["admin", "staff"]}><PlaceholderPage title="Social Media Activities" description="Manage client social media calendars" /></ProtectedLayout>} />
                <Route path="/seo" element={<ProtectedLayout allowedRoles={["admin", "staff"]}><PlaceholderPage title="SEO Activities" description="Track SEO plans and performance" /></ProtectedLayout>} />
                <Route path="/reports" element={<ProtectedLayout allowedRoles={["admin", "staff"]}><PlaceholderPage title="Reports" description="View performance reports and analytics" /></ProtectedLayout>} />
                <Route path="/settings" element={<ProtectedLayout allowedRoles={["admin"]}><Settings /></ProtectedLayout>} />
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
