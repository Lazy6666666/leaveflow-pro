import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { now, recordAudit, requireAnyRole, vendorKey } from "./lib/auth";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireAnyRole(ctx, ["hr_admin"]);
}

async function initializeEmployeeBalancesHandler(ctx: MutationCtx, employeeId: string, year: number) {
  const leaveTypes = await ctx.db.query("leaveTypes").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
  const insertedBalanceIds = [];
  for (const leaveType of leaveTypes) {
    const existing = await ctx.db
      .query("leaveBalances")
      .withIndex("by_employeeId_leaveType_year", (q) => q.eq("employeeId", employeeId).eq("leaveTypeId", leaveType._id).eq("year", year))
      .unique();
    if (!existing) {
      const balanceId = await ctx.db.insert("leaveBalances", {
        employeeId,
        leaveTypeId: leaveType._id,
        year,
        balance: leaveType.annualAllocation,
        createdAt: now(),
        updatedAt: now(),
      });
      insertedBalanceIds.push(balanceId);
    }
  }
  return insertedBalanceIds;
}

export const getBalancesData = query({
  args: { employeeId: v.optional(v.string()), year: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    const leaveTypes = await ctx.db.query("leaveTypes").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
    const balances = [];

    if (args.employeeId) {
      balances.push(
        ...await ctx.db
          .query("leaveBalances")
          .withIndex("by_employeeId_year", (q) =>
            q.eq("employeeId", args.employeeId).eq("year", args.year),
          )
          .collect(),
      );
    }

    return {
      employees: profiles
        .slice()
        .sort((a, b) => (a.fullName ?? a.email ?? "").localeCompare(b.fullName ?? b.email ?? ""))
        .map((profile) => ({ id: profile.userId, full_name: profile.fullName ?? null, email: profile.email ?? null })),
      leaveTypes: leaveTypes.map((leaveType) => ({ id: leaveType._id, name: leaveType.name, annual_allocation: leaveType.annualAllocation })),
      balances: await Promise.all(
        balances.map(async (balance) => {
          const leaveType = await ctx.db.get(balance.leaveTypeId);
          return {
            id: balance._id,
            employee_id: balance.employeeId,
            leave_type_id: balance.leaveTypeId,
            balance: balance.balance,
            year: balance.year,
            leave_types: leaveType ? { name: leaveType.name } : null,
          };
        }),
      ),
    };
  },
});

export const adjustBalance = mutation({
  args: { balanceId: v.id("leaveBalances"), balance: v.number() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const current = await ctx.db.get(args.balanceId);
    await ctx.db.patch(args.balanceId, { balance: args.balance, updatedAt: now() });
    await recordAudit(ctx, {
      tableName: "leave_balances",
      recordId: String(args.balanceId),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: current,
      newData: { ...current, balance: args.balance },
    });
    return { ok: true };
  },
});

export const initializeEmployeeBalances = mutation({
  args: { employeeId: v.string(), year: v.number() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const leaveTypes = await ctx.db.query("leaveTypes").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
    for (const leaveType of leaveTypes) {
      const existing = await ctx.db
        .query("leaveBalances")
        .withIndex("by_employeeId_leaveType_year", (q) => q.eq("employeeId", args.employeeId).eq("leaveTypeId", leaveType._id).eq("year", args.year))
        .unique();
      if (!existing) {
        const balanceId = await ctx.db.insert("leaveBalances", {
          employeeId: args.employeeId,
          leaveTypeId: leaveType._id,
          year: args.year,
          balance: leaveType.annualAllocation,
          createdAt: now(),
          updatedAt: now(),
        });
        await recordAudit(ctx, {
          tableName: "leave_balances",
          recordId: String(balanceId),
          action: "INSERT",
          changedBy: identity.subject,
          newData: await ctx.db.get(balanceId),
        });
      }
    }
    return { ok: true };
  },
});

export const bulkInitializeBalances = mutation({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    for (const profile of profiles) {
      const insertedBalanceIds = await initializeEmployeeBalancesHandler(ctx, profile.userId, args.year);
      for (const balanceId of insertedBalanceIds) {
        await recordAudit(ctx, {
          tableName: "leave_balances",
          recordId: String(balanceId),
          action: "INSERT",
          changedBy: identity.subject,
          newData: await ctx.db.get(balanceId),
        });
      }
    }
    return { ok: true, totalEmployees: profiles.length };
  },
});

export const getBadgeMappingsData = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const mappings = await ctx.db.query("badgeMappings").collect();
    const profiles = await ctx.db.query("profiles").collect();
    const profileMap = new Map(profiles.map((profile) => [profile.userId, profile] as const));
    return {
      mappings: mappings
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((mapping) => ({
          id: mapping._id,
          employee_id: mapping.employeeId,
          badge_id: mapping.badgeId,
          vendor: mapping.vendor ?? null,
          created_at: new Date(mapping.createdAt).toISOString(),
          employee_name: profileMap.get(mapping.employeeId)?.fullName ?? "Unknown",
          employee_email: profileMap.get(mapping.employeeId)?.email ?? "",
        })),
      profiles: profiles
        .slice()
        .sort((a, b) => (a.fullName ?? a.email ?? "").localeCompare(b.fullName ?? b.email ?? ""))
        .map((profile) => ({ id: profile.userId, full_name: profile.fullName ?? null, email: profile.email ?? null })),
    };
  },
});

export const saveBadgeMapping = mutation({
  args: { employeeId: v.string(), badgeId: v.string(), vendor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const existing = await ctx.db.query("badgeMappings").withIndex("by_vendorKey", (q) => q.eq("vendorKey", vendorKey(args.badgeId, args.vendor))).unique();
    if (existing) {
      throw new Error("Badge mapping already exists");
    }
    const mappingId = await ctx.db.insert("badgeMappings", {
      employeeId: args.employeeId,
      badgeId: args.badgeId,
      vendor: args.vendor,
      vendorKey: vendorKey(args.badgeId, args.vendor),
      createdAt: now(),
    });
    await recordAudit(ctx, {
      tableName: "badge_mappings",
      recordId: String(mappingId),
      action: "INSERT",
      changedBy: identity.subject,
      newData: await ctx.db.get(mappingId),
    });
    return { id: mappingId };
  },
});

export const bulkInsertBadgeMappings = mutation({
  args: {
    mappings: v.array(v.object({ employeeId: v.string(), badgeId: v.string(), vendor: v.optional(v.string()) })),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const insertedIds = [];
    for (const mapping of args.mappings) {
      const existing = await ctx.db.query("badgeMappings").withIndex("by_vendorKey", (q) => q.eq("vendorKey", vendorKey(mapping.badgeId, mapping.vendor))).unique();
      if (!existing) {
        const mappingId = await ctx.db.insert("badgeMappings", {
          employeeId: mapping.employeeId,
          badgeId: mapping.badgeId,
          vendor: mapping.vendor,
          vendorKey: vendorKey(mapping.badgeId, mapping.vendor),
          createdAt: now(),
        });
        insertedIds.push(mappingId);
        await recordAudit(ctx, {
          tableName: "badge_mappings",
          recordId: String(mappingId),
          action: "INSERT",
          changedBy: identity.subject,
          newData: await ctx.db.get(mappingId),
        });
      }
    }
    return { insertedIds };
  },
});

export const deleteBadgeMapping = mutation({
  args: { mappingId: v.id("badgeMappings") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const current = await ctx.db.get(args.mappingId);
    if (!current) {
      throw new Error("Badge mapping not found");
    }
    await ctx.db.delete(args.mappingId);
    await recordAudit(ctx, {
      tableName: "badge_mappings",
      recordId: String(args.mappingId),
      action: "DELETE",
      changedBy: identity.subject,
      oldData: current,
    });
    return { ok: true };
  },
});
