import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserRoles, now, recordAudit, requireDirectAnyRole, requireIdentity } from "./lib/auth";
import { insertAnalyticsEvent } from "./lib/analytics";

export const getDelegationsPageData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const roles = await getUserRoles(ctx, identity.subject);
    const canManageDelegations = roles.includes("manager") || roles.includes("hr_admin");
    const delegations = await ctx.db.query("managerDelegations").collect();
    const visibleDelegations = roles.includes("hr_admin")
      ? delegations
      : delegations.filter(
          (delegation) => delegation.managerId === identity.subject || delegation.delegateId === identity.subject,
        );
    const profiles = canManageDelegations ? await ctx.db.query("profiles").collect() : [];

    return {
      canManageDelegations,
      delegations: visibleDelegations
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((delegation) => ({
          id: delegation._id,
          manager_id: delegation.managerId,
          delegate_id: delegation.delegateId,
          start_date: delegation.startDate,
          end_date: delegation.endDate,
          is_active: delegation.isActive,
          created_at: new Date(delegation.createdAt).toISOString(),
        })),
      profiles: profiles.map((profile) => ({
        id: profile.userId,
        full_name: profile.fullName ?? null,
        email: profile.email ?? null,
      })),
    };
  },
});

export const createDelegation = mutation({
  args: {
    managerId: v.optional(v.string()),
    delegateId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    analytics: v.optional(v.object({
      sessionId: v.string(),
      path: v.optional(v.string()),
      roleScope: v.optional(v.string()),
      surface: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireDirectAnyRole(ctx, ["manager", "hr_admin"]);
    const managerId = roles.includes("hr_admin") ? args.managerId ?? identity.subject : identity.subject;
    if (managerId === args.delegateId) {
      throw new Error("You cannot delegate to yourself");
    }
    if (!roles.includes("hr_admin") && args.managerId && args.managerId !== identity.subject) {
      throw new Error("Forbidden");
    }

    const delegationId = await ctx.db.insert("managerDelegations", {
      managerId,
      delegateId: args.delegateId,
      startDate: args.startDate,
      endDate: args.endDate,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    });

    await recordAudit(ctx, {
      tableName: "manager_delegations",
      recordId: String(delegationId),
      action: "INSERT",
      changedBy: identity.subject,
      newData: await ctx.db.get(delegationId),
    });

    if (args.analytics) {
      const start = new Date(`${args.startDate}T00:00:00Z`).getTime();
      const end = new Date(`${args.endDate}T00:00:00Z`).getTime();
      const durationDays = Number.isNaN(start) || Number.isNaN(end) || end < start
        ? undefined
        : Math.floor((end - start) / 86_400_000) + 1;

      await insertAnalyticsEvent(ctx, {
        eventName: "delegation_created",
        sessionId: args.analytics.sessionId,
        userId: identity.subject,
        roleScope: args.analytics.roleScope,
        path: args.analytics.path,
        surface: args.analytics.surface,
        properties: {
          duration_days: durationDays,
          created_by_role: roles.includes("hr_admin") ? "hr_admin" : "manager",
        },
      });
    }

    return { id: delegationId };
  },
});

export const deactivateDelegation = mutation({
  args: {
    delegationId: v.id("managerDelegations"),
    analytics: v.optional(v.object({
      sessionId: v.string(),
      path: v.optional(v.string()),
      roleScope: v.optional(v.string()),
      surface: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireDirectAnyRole(ctx, ["manager", "hr_admin"]);
    const delegation = await ctx.db.get(args.delegationId);
    if (!delegation) {
      throw new Error("Delegation not found");
    }
    if (!roles.includes("hr_admin") && delegation.managerId !== identity.subject) {
      throw new Error("Delegation not found");
    }

    await ctx.db.patch(args.delegationId, {
      isActive: false,
      updatedAt: now(),
    });

    await recordAudit(ctx, {
      tableName: "manager_delegations",
      recordId: String(args.delegationId),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: delegation,
      newData: { ...delegation, isActive: false },
    });

    if (args.analytics) {
      const createdAt = delegation.createdAt;
      const delegationAgeDays = createdAt ? Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000)) : undefined;

      await insertAnalyticsEvent(ctx, {
        eventName: "delegation_deactivated",
        sessionId: args.analytics.sessionId,
        userId: identity.subject,
        roleScope: args.analytics.roleScope,
        path: args.analytics.path,
        surface: args.analytics.surface,
        properties: {
          delegation_age_days: delegationAgeDays,
        },
      });
    }

    return { ok: true };
  },
});
