import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getProfileByUserId, getUserRoles, now, requireIdentity } from "./lib/auth";
import type { MutationCtx } from "./_generated/server";

async function provisionLeaveBalances(ctx: MutationCtx, userId: string) {
  const year = new Date().getFullYear();
  const leaveTypes = await ctx.db.query("leaveTypes").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
  for (const leaveType of leaveTypes) {
    const existing = await ctx.db
      .query("leaveBalances")
      .withIndex("by_employeeId_leaveType_year", (q) =>
        q.eq("employeeId", userId).eq("leaveTypeId", leaveType._id).eq("year", year),
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("leaveBalances", {
        employeeId: userId,
        leaveTypeId: leaveType._id,
        year,
        balance: leaveType.annualAllocation,
        createdAt: now(),
        updatedAt: now(),
      });
    }
  }
}

export const ensureCurrentUser = mutation({
  args: {
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existingProfile = await getProfileByUserId(ctx, identity.subject);
    const timestamp = now();

    if (!existingProfile) {
      await ctx.db.insert("profiles", {
        userId: identity.subject,
        fullName: args.fullName ?? identity.name ?? undefined,
        email: args.email ?? identity.email ?? undefined,
        avatarUrl: args.imageUrl ?? identity.pictureUrl ?? undefined,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      await ctx.db.insert("userRoles", {
        userId: identity.subject,
        role: "employee",
        createdAt: timestamp,
      });
    } else {
      await ctx.db.patch(existingProfile._id, {
        fullName: args.fullName ?? identity.name ?? existingProfile.fullName,
        email: args.email ?? identity.email ?? existingProfile.email,
        avatarUrl: args.imageUrl ?? identity.pictureUrl ?? existingProfile.avatarUrl,
        updatedAt: timestamp,
      });
    }

    await provisionLeaveBalances(ctx, identity.subject);
    return { ok: true };
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const profile = await getProfileByUserId(ctx, identity.subject);
    const roles = await getUserRoles(ctx, identity.subject);
    const admins = await ctx.db.query("userRoles").withIndex("by_role", (q) => q.eq("role", "hr_admin")).collect();

    let department = null;
    if (profile?.departmentId) {
      department = await ctx.db.get(profile.departmentId);
    }

    return {
      userId: identity.subject,
      fullName: profile?.fullName ?? identity.name ?? null,
      email: profile?.email ?? identity.email ?? null,
      avatarUrl: profile?.avatarUrl ?? identity.pictureUrl ?? null,
      department: department ? { id: department._id, name: department.name } : null,
      managerUserId: profile?.managerUserId ?? null,
      roles,
      needsAdminSetup: admins.length === 0,
    };
  },
});

export const getProfileSettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const profile = await getProfileByUserId(ctx, identity.subject);
    if (!profile) {
      return null;
    }

    const department = profile.departmentId ? await ctx.db.get(profile.departmentId) : null;
    const avatarUrl = profile.avatarStorageId ? await ctx.storage.getUrl(profile.avatarStorageId) : profile.avatarUrl ?? null;

    return {
      full_name: profile.fullName ?? null,
      email: profile.email ?? null,
      avatar_url: avatarUrl,
      department_name: department?.name ?? null,
    };
  },
});

export const updateProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const profile = await getProfileByUserId(ctx, identity.subject);
    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      fullName: args.fullName,
      updatedAt: now(),
    });

    return { ok: true };
  },
});

export const updateAvatar = mutation({
  args: {
    storageId: v.id("_storage"),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const profile = await getProfileByUserId(ctx, identity.subject);
    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      avatarStorageId: args.storageId,
      avatarUrl: args.url,
      updatedAt: now(),
    });

    return { ok: true };
  },
});
