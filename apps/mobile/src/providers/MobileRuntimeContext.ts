import { createContext } from "react";

export type MobileRuntimeValue = {
  hasBackendEnv: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
  userLabel: string | null;
  signOut: (() => Promise<void>) | null;
  authSyncStatus: string | null;
  authSyncDetail: string | null;
};

const defaultMobileRuntimeValue: MobileRuntimeValue = {
  hasBackendEnv: false,
  isLoaded: true,
  isSignedIn: false,
  userLabel: null,
  signOut: null,
  authSyncStatus: null,
  authSyncDetail: null,
};

export const MobileRuntimeContext = createContext<MobileRuntimeValue>(
  defaultMobileRuntimeValue,
);
