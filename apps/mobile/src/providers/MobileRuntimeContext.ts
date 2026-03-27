import { createContext } from "react";

export type MobileRole = "employee" | "manager" | "hr_admin";

export type MobileRuntimeValue = {
  hasBackendEnv: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
  userLabel: string | null;
  roles: MobileRole[];
  primaryRole: MobileRole;
  hasManagerAccess: boolean;
  signOut: (() => Promise<void>) | null;
  authSyncStatus: string | null;
  authSyncDetail: string | null;
};

const defaultMobileRuntimeValue: MobileRuntimeValue = {
  hasBackendEnv: false,
  isLoaded: true,
  isSignedIn: false,
  userLabel: null,
  roles: [],
  primaryRole: "employee",
  hasManagerAccess: false,
  signOut: null,
  authSyncStatus: null,
  authSyncDetail: null,
};

export const MobileRuntimeContext = createContext<MobileRuntimeValue>(
  defaultMobileRuntimeValue,
);
