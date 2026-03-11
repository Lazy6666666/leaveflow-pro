import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserRoles, now, recordAudit, requireDirectAnyRole, requireIdentity } from "./lib/auth";

export const getDelegationsPageData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const roles = await getUserRoles(ctx, identity.subject);
    const canManageDelegations = roles.includes("manager") || roles.includes("hr_admin");
    const delegations = await ctx.db.query("managerDelegations").collect();
    const visibleDelegations = delegations.filter(
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
    delegateId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireDirectAnyRole(ctx, ["manager", "hr_admin"]);
    if (identity.subject === args.delegateId) {
      throw new Error("You cannot delegate to yourself");
    }

    const delegationId = await ctx.db.insert("managerDelegations", {
      managerId: identity.subject,
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

    return { id: delegationId };
  },
});

export const deactivateDelegation = mutation({
  args: {
    delegationId: v.id("managerDelegations"),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireDirectAnyRole(ctx, ["manager", "hr_admin"]);
    const delegation = await ctx.db.get(args.delegationId);
    if (!delegation || delegation.managerId !== identity.subject) {
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

    return { ok: true };
  },
});
