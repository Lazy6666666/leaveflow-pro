import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AuthGuard from "@/components/AuthGuard";
import RoleGuard from "@/components/RoleGuard";
import AppLayout from "@/components/AppLayout";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import MyLeave from "./pages/MyLeave";
import RequestLeave from "./pages/RequestLeave";
import Holidays from "./pages/Holidays";
import ProfileSettings from "./pages/ProfileSettings";
import LeaveHistory from "./pages/LeaveHistory";
import AttendanceHistory from "./pages/AttendanceHistory";
import Approvals from "./pages/manager/Approvals";
import AdminSetup from "./pages/AdminSetup";
import TeamCalendar from "./pages/manager/TeamCalendar";
import TeamAttendance from "./pages/manager/TeamAttendance";
import Employees from "./pages/admin/Employees";
import Policies from "./pages/admin/Policies";
import Reports from "./pages/admin/Reports";
import Departments from "./pages/admin/Departments";
import Balances from "./pages/admin/Balances";
import AttendanceDashboard from "./pages/admin/AttendanceDashboard";
import BiometricsSettings from "./pages/admin/BiometricsSettings";
import AttendanceSettingsPage from "./pages/admin/AttendanceSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-leave" element={<MyLeave />} />
                <Route path="/request-leave" element={<RequestLeave />} />
                <Route path="/leave-history" element={<LeaveHistory />} />
                <Route path="/attendance" element={<AttendanceHistory />} />
                <Route path="/holidays" element={<Holidays />} />
                <Route path="/profile" element={<ProfileSettings />} />
                <Route path="/admin-setup" element={<AdminSetup />} />
                <Route path="/manager/approvals" element={<RoleGuard allowedRoles={["manager", "hr_admin"]}><Approvals /></RoleGuard>} />
                <Route path="/manager/team-calendar" element={<RoleGuard allowedRoles={["manager", "hr_admin"]}><TeamCalendar /></RoleGuard>} />
                <Route path="/manager/team-attendance" element={<RoleGuard allowedRoles={["manager", "hr_admin"]}><TeamAttendance /></RoleGuard>} />
                <Route path="/admin/employees" element={<RoleGuard allowedRoles={["hr_admin"]}><Employees /></RoleGuard>} />
                <Route path="/admin/policies" element={<RoleGuard allowedRoles={["hr_admin"]}><Policies /></RoleGuard>} />
                <Route path="/admin/reports" element={<RoleGuard allowedRoles={["hr_admin"]}><Reports /></RoleGuard>} />
                <Route path="/admin/departments" element={<RoleGuard allowedRoles={["hr_admin"]}><Departments /></RoleGuard>} />
                <Route path="/admin/balances" element={<RoleGuard allowedRoles={["hr_admin"]}><Balances /></RoleGuard>} />
                <Route path="/admin/attendance" element={<RoleGuard allowedRoles={["hr_admin"]}><AttendanceDashboard /></RoleGuard>} />
                <Route path="/admin/biometrics" element={<RoleGuard allowedRoles={["hr_admin"]}><BiometricsSettings /></RoleGuard>} />
                <Route path="/admin/attendance-settings" element={<RoleGuard allowedRoles={["hr_admin"]}><AttendanceSettingsPage /></RoleGuard>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
