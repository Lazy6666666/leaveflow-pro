import { ClerkProvider, useAuth, useClerk, useUser } from "@clerk/expo";
import { resourceCache } from "@clerk/expo/resource-cache";
import { tokenCache } from "@clerk/expo/token-cache";
import { type ReactNode, useEffect, useState } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useConvexAuth, useMutation } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { mobileEnv, hasMobileBackendEnv } from "../config/env";
import { convexClient } from "../lib/convex";
import { MobileRuntimeProvider } from "./MobileRuntime";
import { describeAuthSyncState } from "./authSync";

type ClerkTokenProbe = {
  status: "idle" | "requesting" | "received" | "missing" | "error";
  detail: string | null;
};

function ClerkRuntimeBridge({
  children,
  tokenProbe,
}: {
  children: ReactNode;
  tokenProbe: ClerkTokenProbe;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { isLoading: convexAuthLoading, isAuthenticated: isConvexAuthenticated } = useConvexAuth();
  const ensureCurrentUser = useMutation(api.users.ensureCurrentUser);
  const [isSyncingUser, setIsSyncingUser] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!isLoaded || !isSignedIn || !user || !isConvexAuthenticated) {
      setIsSyncingUser(false);
      return () => {
        cancelled = true;
      };
    }

    const syncCurrentUser = async () => {
      setIsSyncingUser(true);
      try {
        await ensureCurrentUser({
          fullName: user.fullName ?? undefined,
          email: user.primaryEmailAddress?.emailAddress ?? undefined,
          imageUrl: user.imageUrl ?? undefined,
        });
      } finally {
        if (!cancelled) {
          setIsSyncingUser(false);
        }
      }
    };

    void syncCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [ensureCurrentUser, isConvexAuthenticated, isLoaded, isSignedIn, user]);

  const authSyncState = describeAuthSyncState({
    clerkLoaded: isLoaded,
    clerkSignedIn: Boolean(isSignedIn),
    convexAuthLoading,
    convexAuthenticated: Boolean(isConvexAuthenticated),
    syncingUser: isSyncingUser,
  });
  const authSyncDetail =
    authSyncState.status === "waiting_for_convex" && tokenProbe.detail
      ? `${authSyncState.detail}\n\n${tokenProbe.detail}`
      : authSyncState.detail;

  return (
    <MobileRuntimeProvider
      value={{
        hasBackendEnv: true,
        isLoaded: authSyncState.runtimeLoaded,
        isSignedIn: authSyncState.runtimeSignedIn,
        userLabel: user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? null,
        signOut,
        authSyncStatus: authSyncState.status,
        authSyncDetail: authSyncDetail,
      }}
    >
      {children}
    </MobileRuntimeProvider>
  );
}

function ClerkConvexBridge({
  children,
  client,
}: {
  children: ReactNode;
  client: NonNullable<typeof convexClient>;
}) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [convexAuthSeed, setConvexAuthSeed] = useState(0);
  const [tokenProbe, setTokenProbe] = useState<ClerkTokenProbe>({
    status: "idle",
    detail: null,
  });

  useEffect(() => {
    let cancelled = false;
    let tokenResolved = false;

    if (!isLoaded || !isSignedIn || !user?.id) {
      setConvexAuthSeed(0);
      setTokenProbe({
        status: "idle",
        detail: null,
      });
      return () => {
        cancelled = true;
      };
    }

    const probeConvexToken = async () => {
      if (cancelled || tokenResolved) {
        return;
      }

      setTokenProbe({
        status: "requesting",
        detail: "Checking whether Clerk can mint the Convex session token on this device.",
      });

      try {
        const token = await getToken({ template: "convex" });

        if (cancelled) {
          return;
        }

        if (!token) {
          setTokenProbe({
            status: "missing",
            detail:
              "Clerk did not return a Convex token yet. This usually means the mobile session is restored but the Convex JWT is not available in Expo Go.",
          });
          return;
        }

        tokenResolved = true;
        setTokenProbe({
          status: "received",
          detail: "Clerk returned a Convex token. Waiting for Convex to finish the secure-session handshake.",
        });
        setConvexAuthSeed((current) => current + 1);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setTokenProbe({
          status: "error",
          detail:
            error instanceof Error
              ? `Clerk token request failed: ${error.message}`
              : "Clerk token request failed before Convex could authenticate.",
        });
      }
    };

    void probeConvexToken();
    const retryTimer = setInterval(() => {
      void probeConvexToken();
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(retryTimer);
    };
    // Clerk Expo's useAuth hook is not memoized; user/session transitions are the meaningful triggers here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user?.id]);

  const providerKey = `${user?.id ?? "anonymous"}:${convexAuthSeed}`;

  return (
    <ConvexProviderWithClerk
      client={client}
      key={providerKey}
      useAuth={useAuth}
    >
      <ClerkRuntimeBridge tokenProbe={tokenProbe}>{children}</ClerkRuntimeBridge>
    </ConvexProviderWithClerk>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const client = convexClient;

  if (!hasMobileBackendEnv || !client) {
    return (
      <MobileRuntimeProvider
        value={{
          hasBackendEnv: false,
          isLoaded: true,
          isSignedIn: false,
          userLabel: null,
          signOut: null,
          authSyncStatus: null,
          authSyncDetail: null,
        }}
      >
        {children}
      </MobileRuntimeProvider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={mobileEnv.clerkPublishableKey}
      __experimental_resourceCache={resourceCache}
      tokenCache={tokenCache}
    >
      <ClerkConvexBridge client={client}>{children}</ClerkConvexBridge>
    </ClerkProvider>
  );
}
