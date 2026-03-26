import type { AppRole } from "../../convex/constants";

const SESSION_STORAGE_KEY = "balance.analytics.session_id";
const TRACKED_ONCE_KEY_PREFIX = "balance.analytics.once.";

function canUseStorage() {
  return typeof window !== "undefined";
}

function generateSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function getAnalyticsSessionId() {
  if (!canUseStorage()) {
    return "server";
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const next = generateSessionId();
  window.localStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

export function claimTrackOnce(key: string) {
  if (!canUseStorage()) {
    return true;
  }

  const storageKey = `${TRACKED_ONCE_KEY_PREFIX}${key}`;
  if (window.sessionStorage.getItem(storageKey)) {
    return false;
  }

  window.sessionStorage.setItem(storageKey, "1");
  return true;
}

export function getRoleScope(roles: AppRole[], hasManagerAccess: boolean) {
  const scopes = ["employee"];

  if (roles.includes("hr_admin")) {
    scopes.push("hr_admin");
  }

  if (roles.includes("manager")) {
    scopes.push("manager");
  } else if (hasManagerAccess) {
    scopes.push("manager_delegated");
  }

  return Array.from(new Set(scopes)).join("+");
}

export function getAnalyticsSurface(pathname: string) {
  if (pathname === "/") return "landing";
  if (pathname.startsWith("/auth")) return "auth";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/request-leave")) return "leave";
  if (pathname.startsWith("/my-leave") || pathname.startsWith("/leave-history")) return "leave";
  if (pathname.startsWith("/attendance")) return "attendance";
  if (pathname.startsWith("/ai-workspace")) return "ai_workspace";
  if (pathname.startsWith("/admin-setup")) return "admin_setup";
  if (pathname.startsWith("/manager")) return "manager";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/holidays")) return "holidays";
  return "app";
}

export function normalizeAnalyticsError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("unauthorized") || normalized.includes("forbidden")) return "unauthorized";
  if (normalized.includes("network")) return "network_error";
  if (normalized.includes("validation")) return "validation_error";
  if (normalized.includes("selfie")) return "missing_selfie";
  if (normalized.includes("location")) return "missing_location";
  if (normalized.includes("geofence")) return "geofence_rejected";
  if (normalized.includes("already")) return "already_completed";
  return "unknown";
}

export function getDateSpanDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return undefined;
  }

  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return undefined;
  }

  return Math.floor((end - start) / 86_400_000) + 1;
}

export function bucketMessageLength(length: number) {
  if (length <= 40) return "short";
  if (length <= 160) return "medium";
  return "long";
}

export function bucketWorkDurationHours(minutes?: number) {
  if (minutes === undefined) return undefined;
  const hours = minutes / 60;
  if (hours < 4) return "under_4";
  if (hours < 8) return "4_to_8";
  if (hours < 10) return "8_to_10";
  return "10_plus";
}
