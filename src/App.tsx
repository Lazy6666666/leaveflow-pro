import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from 'react-helmet-async';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AuthGuard from "@/components/AuthGuard";
import RoleGuard from "@/components/RoleGuard";
import AppLayout from "@/components/AppLayout";

function lazyWithRetry<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload();
      return new Promise<never>(() => {});
    })
  );
}

const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Index = lazyWithRetry(() => import("./pages/Index"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const AIWorkspace = lazyWithRetry(() => import("./pages/AIWorkspace"));
const AttendanceHistory = lazyWithRetry(() => import("./pages/AttendanceHistory"));
const AdminSetup = lazyWithRetry(() => import("./pages/AdminSetup"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

// Hub pages
const IdentityHub = lazyWithRetry(() => import("./pages/IdentityHub"));
const ManagerHub = lazyWithRetry(() => import("./pages/manager/ManagerHub"));
const SystemHub = lazyWithRetry(() => import("./pages/admin/SystemHub"));
const HROperationsHub = lazyWithRetry(() => import("./pages/admin/HROperationsHub"));

// Extracted pages
const MyLeave = lazyWithRetry(() => import("./pages/MyLeave"));
const Holidays = lazyWithRetry(() => import("./pages/Holidays"));

const queryClient = new QueryClient();

const routeFallback = <div className="min-h-screen bg-background" />;
const lazyRoute = (element: React.ReactElement) => (
  <Suspense fallback={routeFallback}>{element}</Suspense>
);

const App = () => {

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthProvider>
                  <Routes>
                    <Route path="/auth/*" element={lazyRoute(<Auth />)} />
                    <Route path="/reset-password" element={lazyRoute(<ResetPassword />)} />
                    <Route path="/" element={lazyRoute(<Index />)} />
                    <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
                      <Route path="/dashboard" element={lazyRoute(<Dashboard />)} />
                      <Route path="/ai-workspace" element={lazyRoute(<AIWorkspace />)} />
                      <Route path="/attendance" element={lazyRoute(<AttendanceHistory />)} />
                      <Route path="/admin-setup" element={lazyRoute(<AdminSetup />)} />

                      {/* Direct pages previously hidden in Hubs */}
                      <Route path="/my-leave" element={lazyRoute(<MyLeave />)} />
                      <Route path="/holidays" element={lazyRoute(<Holidays />)} />
                      
                      {/* Hub routes */}
                      <Route path="/identity-hub" element={lazyRoute(<IdentityHub />)} />
                      <Route path="/manager/hub" element={<RoleGuard allowedRoles={["manager", "hr_admin"]} allowDelegatedManagerAccess>{lazyRoute(<ManagerHub />)}</RoleGuard>} />
                      <Route path="/admin/system" element={<RoleGuard allowedRoles={["hr_admin"]}>{lazyRoute(<SystemHub />)}</RoleGuard>} />
                      <Route path="/admin/hr-operations" element={<RoleGuard allowedRoles={["hr_admin"]}>{lazyRoute(<HROperationsHub />)}</RoleGuard>} />

                      {/* Legacy redirects */}
                      <Route path="/leave-hub" element={<Navigate to="/my-leave" replace />} />
                      <Route path="/request-leave" element={<Navigate to="/my-leave" replace />} />
                      <Route path="/leave-history" element={<Navigate to="/my-leave" replace />} />
                      <Route path="/profile" element={<Navigate to="/identity-hub?tab=profile" replace />} />
                      <Route path="/face-enrollment" element={<Navigate to="/identity-hub?tab=biometrics" replace />} />
                      <Route path="/manager/approvals" element={<Navigate to="/manager/hub?tab=approvals" replace />} />
                      <Route path="/manager/team-calendar" element={<Navigate to="/manager/hub?tab=team-calendar" replace />} />
                      <Route path="/manager/team-attendance" element={<Navigate to="/manager/hub?tab=team-attendance" replace />} />
                      <Route path="/manager/delegation" element={<Navigate to="/manager/hub?tab=delegation" replace />} />
                      <Route path="/admin/policies" element={<Navigate to="/admin/system?tab=policies" replace />} />
                      <Route path="/admin/sites" element={<Navigate to="/admin/system?tab=sites" replace />} />
                      <Route path="/admin/attendance-settings" element={<Navigate to="/admin/system?tab=attendance-config" replace />} />
                      <Route path="/admin/biometrics" element={<Navigate to="/admin/system?tab=biometrics" replace />} />
                      <Route path="/admin/shifts" element={<Navigate to="/admin/system?tab=shifts" replace />} />
                      <Route path="/admin/rosters" element={<Navigate to="/admin/system?tab=rosters" replace />} />
                      <Route path="/admin/employees" element={<Navigate to="/admin/hr-operations?tab=directory" replace />} />
                      <Route path="/admin/departments" element={<Navigate to="/admin/hr-operations?tab=departments" replace />} />
                      <Route path="/admin/balances" element={<Navigate to="/admin/hr-operations?tab=balances" replace />} />
                      <Route path="/admin/attendance" element={<Navigate to="/admin/hr-operations?tab=attendance" replace />} />
                      <Route path="/admin/reports" element={<Navigate to="/admin/hr-operations?tab=analytics" replace />} />
                      <Route path="/admin/audit-log" element={<Navigate to="/admin/hr-operations?tab=audits" replace />} />
                      <Route path="/admin/trust-review" element={<Navigate to="/admin/hr-operations?tab=trust-review" replace />} />
                      <Route path="/admin/badge-mappings" element={<Navigate to="/admin/system?tab=attendance-config" replace />} />
                      <Route path="/admin/sites/:siteId" element={<Navigate to="/admin/system?tab=sites" replace />} />
                    </Route>
                    <Route path="*" element={lazyRoute(<NotFound />)} />
                  </Routes>
                </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
