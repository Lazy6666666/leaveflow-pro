import type { AppRole, HalfDayType } from "../constants";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { NotificationType } from "../constants";
import type { ManagerDelegationDoc, ProfileDoc } from "./types";
import { filterRecordsBySiteScope } from "../siteScope";

type ReadCtx = QueryCtx | MutationCtx;

export async function requireIdentity(ctx: ReadCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
}

export async function getProfileByUserId(ctx: ReadCtx, userId: string): Promise<ProfileDoc | null> {
  return await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
}

export async function getUserRoles(ctx: ReadCtx, userId: string): Promise<AppRole[]> {
  const roles = await ctx.db.query("userRoles").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
  return roles.map((role) => role.role);
}

export async function hasRole(ctx: ReadCtx, userId: string, role: AppRole) {
  const match = await ctx.db
    .query("userRoles")
    .withIndex("by_userId_role", (q) => q.eq("userId", userId).eq("role", role))
    .unique();
  return !!match;
}

export async function canManageEmployee(
  ctx: ReadCtx,
  viewerUserId: string,
  employeeId: string,
  roles?: AppRole[],
) {
  const resolvedRoles = roles ?? await getUserRoles(ctx, viewerUserId);
  if (resolvedRoles.includes("hr_admin")) {
    return true;
  }

  return (await getManagedEmployeeIds(ctx, viewerUserId)).includes(employeeId);
}

export async function getAssignedSiteIds(ctx: ReadCtx, userId: string) {
  const assignments = await ctx.db
    .query("siteSupervisors")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();

  return Array.from(new Set(assignments.map((assignment) => String(assignment.siteId))));
}

export async function getAccessibleSiteIds(
  ctx: ReadCtx,
  userId: string,
  roles?: AppRole[],
) {
  const resolvedRoles = roles ?? await getUserRoles(ctx, userId);
  if (resolvedRoles.includes("hr_admin")) {
    return null;
  }

  return await getAssignedSiteIds(ctx, userId);
}

export function assertRequestedSiteInScope(requestedSiteId: string | undefined, accessibleSiteIds: string[] | null) {
  if (requestedSiteId && accessibleSiteIds && !accessibleSiteIds.includes(requestedSiteId)) {
    throw new Error("Forbidden");
  }
}

export function applySiteScope<T extends { siteId?: string | null }>(
  records: T[],
  accessibleSiteIds: string[] | null,
  requestedSiteId?: string,
): T[] {
  return filterRecordsBySiteScope<T>(records, accessibleSiteIds, requestedSiteId);
}

export async function requireAnyRole(ctx: ReadCtx, allowedRoles: AppRole[]) {
  const identity = await requireIdentity(ctx);
  const roles = await getUserRoles(ctx, identity.subject);
  const hasAllowedRole = allowedRoles.some((role) => roles.includes(role));
  const hasDelegatedManagerAccess = !hasAllowedRole &&
    allowedRoles.includes("manager") &&
    await hasActiveManagerDelegation(ctx, identity.subject);

  if (!hasAllowedRole && !hasDelegatedManagerAccess) {
    throw new Error("Forbidden");
  }
  return { identity, roles, hasDelegatedManagerAccess };
}

export async function requireDirectAnyRole(ctx: ReadCtx, allowedRoles: AppRole[]) {
  const identity = await requireIdentity(ctx);
  const roles = await getUserRoles(ctx, identity.subject);
  const hasAllowedRole = allowedRoles.some((role) => roles.includes(role));

  if (!hasAllowedRole) {
    throw new Error("Forbidden");
  }

  return { identity, roles };
}

export function vendorKey(badgeId: string, vendor?: string | null) {
  return `${vendor ?? "all"}::${badgeId.toLowerCase()}`;
}

export function now() {
  return Date.now();
}

export function toIso(timestamp?: number | null) {
  return timestamp ? new Date(timestamp).toISOString() : null;
}

export function formatDayCount(startDate: string, endDate: string, halfDayType?: HalfDayType | null) {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  const diffDays = Math.floor((end - start) / 86_400_000) + 1;
  return halfDayType ? diffDays - 0.5 : diffDays;
}

export function isDateInRange(targetDate: string, startDate: string, endDate: string) {
  return targetDate >= startDate && targetDate <= endDate;
}

export async function recordAudit(ctx: MutationCtx, input: {
  tableName: string;
  recordId: string;
  action: string;
  changedBy?: string | null;
  oldData?: unknown;
  newData?: unknown;
}) {
  if (input.action === "UPDATE" && !hasAuditDiff(input.oldData, input.newData)) {
    return;
  }

  await ctx.db.insert("auditLogs", {
    tableName: input.tableName,
    recordId: input.recordId,
    action: input.action,
    changedBy: input.changedBy ?? undefined,
    oldData: input.oldData,
    newData: input.newData,
    createdAt: now(),
  });
}

function normalizeAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeAuditValue(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, normalizeAuditValue(entry)]),
  );
}

export function hasAuditDiff(oldData: unknown, newData: unknown) {
  return JSON.stringify(normalizeAuditValue(oldData)) !== JSON.stringify(normalizeAuditValue(newData));
}

export async function createNotification(ctx: MutationCtx, input: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}) {
  await ctx.db.insert("notifications", {
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    isRead: false,
    createdAt: now(),
  });
}

export async function getManagedEmployeeIds(ctx: ReadCtx, userId: string) {
  const directReports = await ctx.db
    .query("profiles")
    .withIndex("by_managerUserId", (q) => q.eq("managerUserId", userId))
    .collect();

  const delegatedProfiles: ProfileDoc[] = [];
  for (const delegation of await getActiveManagerDelegations(ctx, userId)) {
    const managerProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_managerUserId", (q) => q.eq("managerUserId", delegation.managerId))
      .collect();
    delegatedProfiles.push(...managerProfiles);
  }

  return Array.from(
    new Set([...directReports, ...delegatedProfiles].map((profile) => profile.userId)),
  );
}

export async function getActiveManagerDelegations(ctx: ReadCtx, userId: string): Promise<ManagerDelegationDoc[]> {
  const today = new Date().toISOString().slice(0, 10);
  const delegations = await ctx.db
    .query("managerDelegations")
    .withIndex("by_delegateId", (q) => q.eq("delegateId", userId))
    .collect();

  return delegations.filter(
    (delegation) =>
      delegation.isActive &&
      isDateInRange(today, delegation.startDate, delegation.endDate),
  );
}

export async function hasActiveManagerDelegation(ctx: ReadCtx, userId: string) {
  return (await getActiveManagerDelegations(ctx, userId)).length > 0;
}
