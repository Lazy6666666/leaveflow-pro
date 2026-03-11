import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "employee" | "manager" | "hr_admin";

const RoleGuard = ({
  children,
  allowedRoles,
  allowDelegatedManagerAccess = false,
}: {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  allowDelegatedManagerAccess?: boolean;
}) => {
  const { hasExplicitRole, hasRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const hasAccess = allowedRoles.some((role) => {
    if (role === "manager" && allowDelegatedManagerAccess) {
      return hasRole("manager");
    }

    return hasExplicitRole(role);
  });

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
