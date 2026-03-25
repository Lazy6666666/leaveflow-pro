import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { AppRole } from "../../convex/constants";
import { syncSentryViewer } from "@/lib/sentry";

type AppUser = {
  id: string;
  email?: string | null;
  fullName?: string | null;
  imageUrl?: string | null;
  user_metadata?: {
    full_name?: string | null;
    avatar_url?: string | null;
  };
};

type AuthSession = {
  userId: string;
};

interface AuthContextType {
  session: AuthSession | null;
  user: AppUser | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasExplicitRole: (role: AppRole) => boolean;
  hasManagerAccess: boolean;
  needsAdminSetup: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  roles: [],
  loading: true,
  signOut: async () => {},
  hasRole: () => false,
  hasExplicitRole: () => false,
  hasManagerAccess: false,
  needsAdminSetup: false,
});

export const useAuth = (): AuthContextType => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded, isSignedIn } = useClerkAuth();
  const { isLoading: convexAuthLoading, isAuthenticated: isConvexAuthenticated } = useConvexAuth();
  const clerk = useClerk();
  const ensureCurrentUser = useMutation(api.users.ensureCurrentUser);
  const currentUser = useQuery(api.users.current, isConvexAuthenticated ? {} : "skip");
  const delegationsPageData = useQuery(api.manager.getDelegationsPageData, isConvexAuthenticated ? {} : "skip");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!authLoaded || !userLoaded || !isSignedIn || !clerkUser || !isConvexAuthenticated) {
      setSyncing(false);
      return () => {
        cancelled = true;
      };
    }

    const sync = async () => {
      setSyncing(true);
      try {
        await ensureCurrentUser({
          fullName: clerkUser.fullName ?? undefined,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? undefined,
          imageUrl: clerkUser.imageUrl ?? undefined,
        });
      } finally {
        if (!cancelled) {
          setSyncing(false);
        }
      }
    };

    sync().catch(() => {
      if (!cancelled) {
        setSyncing(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authLoaded, clerkUser, ensureCurrentUser, isConvexAuthenticated, isSignedIn, userLoaded]);

  useEffect(() => {
    if (!isSignedIn || !clerkUser) {
      syncSentryViewer(null);
      return;
    }

    syncSentryViewer({
      id: clerkUser.id,
      roles: currentUser?.roles,
    });
  }, [clerkUser, currentUser?.roles, isSignedIn]);

  const signOut = useCallback(async (): Promise<void> => {
    await clerk.signOut({ redirectUrl: "/auth" });
  }, [clerk]);

  const user = useMemo<AppUser | null>(() => {
    if (!clerkUser) {
      return null;
    }

    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      fullName: clerkUser.fullName ?? null,
      imageUrl: clerkUser.imageUrl ?? null,
      user_metadata: {
        full_name: clerkUser.fullName ?? null,
        avatar_url: clerkUser.imageUrl ?? null,
      },
    };
  }, [clerkUser]);

  const activeDelegation = useMemo<boolean>(() => {
    if (!user || !delegationsPageData) {
      return false;
    }

    const today = new Date().toISOString().slice(0, 10);
    return delegationsPageData.delegations.some(
      (delegation) =>
        delegation.delegate_id === user.id &&
        delegation.is_active &&
        delegation.start_date <= today &&
        delegation.end_date >= today,
    );
  }, [delegationsPageData, user]);

  const loading = !authLoaded ||
    !userLoaded ||
    (isSignedIn && convexAuthLoading) ||
    syncing ||
    (isConvexAuthenticated && (currentUser === undefined || delegationsPageData === undefined));

  const roles = useMemo<AppRole[]>(() => currentUser?.roles ?? [], [currentUser?.roles]);
  const hasManagerAccess = useMemo(
    () => roles.includes("manager") || roles.includes("hr_admin") || activeDelegation,
    [activeDelegation, roles],
  );
  const hasExplicitRole = useCallback((role: AppRole) => roles.includes(role), [roles]);
  const hasRole = useCallback((role: AppRole) => {
    if (role === "manager") {
      return hasManagerAccess;
    }
    return hasExplicitRole(role);
  }, [hasExplicitRole, hasManagerAccess]);
  const session = useMemo<AuthSession | null>(
    () => (user && isConvexAuthenticated ? { userId: user.id } : null),
    [isConvexAuthenticated, user],
  );
  const authContextValue = useMemo<AuthContextType>(
    () => ({
      session,
      user,
      roles,
      loading,
      signOut,
      hasRole,
      hasExplicitRole,
      hasManagerAccess,
      needsAdminSetup: currentUser?.needsAdminSetup ?? false,
    }),
    [currentUser?.needsAdminSetup, hasExplicitRole, hasManagerAccess, hasRole, loading, roles, session, signOut, user],
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
