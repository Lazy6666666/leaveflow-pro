export type AuthSyncSnapshot = {
  status:
    | "loading_clerk"
    | "signed_out"
    | "waiting_for_convex"
    | "syncing_profile"
    | "ready";
  detail: string | null;
  runtimeLoaded: boolean;
  runtimeSignedIn: boolean;
};

export function describeAuthSyncState(input: {
  clerkLoaded: boolean;
  clerkSignedIn: boolean;
  convexAuthLoading: boolean;
  convexAuthenticated: boolean;
  syncingUser: boolean;
}): AuthSyncSnapshot {
  if (!input.clerkLoaded) {
    return {
      status: "loading_clerk",
      detail: "Loading Clerk session.",
      runtimeLoaded: false,
      runtimeSignedIn: false,
    };
  }

  if (!input.clerkSignedIn) {
    return {
      status: "signed_out",
      detail: null,
      runtimeLoaded: true,
      runtimeSignedIn: false,
    };
  }

  if (input.convexAuthenticated && input.syncingUser) {
    return {
      status: "syncing_profile",
      detail: "Provisioning your employee profile after the secure session handshake.",
      runtimeLoaded: false,
      runtimeSignedIn: false,
    };
  }

  if (input.convexAuthenticated) {
    return {
      status: "ready",
      detail: null,
      runtimeLoaded: true,
      runtimeSignedIn: true,
    };
  }

  return {
    status: "waiting_for_convex",
    detail: input.convexAuthLoading
      ? "Convex is still validating the Clerk session token."
      : "Waiting for Convex to accept the Clerk session token.",
    runtimeLoaded: false,
    runtimeSignedIn: false,
  };
}
