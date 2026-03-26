import { describe, expect, it } from "vitest";

import { describeAuthSyncState } from "./authSync";

describe("describeAuthSyncState", () => {
  it("returns signed_out when Clerk is loaded without a session", () => {
    expect(
      describeAuthSyncState({
        clerkLoaded: true,
        clerkSignedIn: false,
        convexAuthLoading: false,
        convexAuthenticated: false,
        syncingUser: false,
      }),
    ).toEqual({
      status: "signed_out",
      detail: null,
      runtimeLoaded: true,
      runtimeSignedIn: false,
    });
  });

  it("returns waiting_for_convex while Convex is validating the Clerk session", () => {
    expect(
      describeAuthSyncState({
        clerkLoaded: true,
        clerkSignedIn: true,
        convexAuthLoading: true,
        convexAuthenticated: false,
        syncingUser: false,
      }),
    ).toEqual({
      status: "waiting_for_convex",
      detail: "Convex is still validating the Clerk session token.",
      runtimeLoaded: false,
      runtimeSignedIn: false,
    });
  });

  it("returns waiting_for_convex after Clerk is signed in but Convex is not authenticated yet", () => {
    expect(
      describeAuthSyncState({
        clerkLoaded: true,
        clerkSignedIn: true,
        convexAuthLoading: false,
        convexAuthenticated: false,
        syncingUser: false,
      }),
    ).toEqual({
      status: "waiting_for_convex",
      detail: "Waiting for Convex to accept the Clerk session token.",
      runtimeLoaded: false,
      runtimeSignedIn: false,
    });
  });

  it("returns syncing_profile when Convex is authenticated but the user mirror is still syncing", () => {
    expect(
      describeAuthSyncState({
        clerkLoaded: true,
        clerkSignedIn: true,
        convexAuthLoading: false,
        convexAuthenticated: true,
        syncingUser: true,
      }),
    ).toEqual({
      status: "syncing_profile",
      detail: "Provisioning your employee profile after the secure session handshake.",
      runtimeLoaded: false,
      runtimeSignedIn: false,
    });
  });

  it("returns ready once Convex is authenticated and profile sync is complete", () => {
    expect(
      describeAuthSyncState({
        clerkLoaded: true,
        clerkSignedIn: true,
        convexAuthLoading: false,
        convexAuthenticated: true,
        syncingUser: false,
      }),
    ).toEqual({
      status: "ready",
      detail: null,
      runtimeLoaded: true,
      runtimeSignedIn: true,
    });
  });
});
