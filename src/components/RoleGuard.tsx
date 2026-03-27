import { Navigate } from "react-router-dom";
import { useAuth, type AppFeature } from "@/contexts/AuthContext";
import type { AppRole } from "../../convex/constants";

const RoleGuard = ({
  children,
  allowedRoles,
  allowDelegatedManagerAccess = false,
  requiredFeature,
  fallbackTo = "/dashboard",
}: {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  allowDelegatedManagerAccess?: boolean;
  requiredFeature?: AppFeature;
  fallbackTo?: string;
}) => {
  const { hasExplicitRole, hasFeature = () => true, hasRole, loading } = useAuth();

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

    if (role === "manager") {
      return hasExplicitRole("manager") || hasExplicitRole("hr_admin");
    }

    return hasRole(role);
  });

  if (!hasAccess || (requiredFeature && !hasFeature(requiredFeature))) {
    return <Navigate to={fallbackTo} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
