import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getProfileByUserId, getUserRoles, now, requireIdentity } from "./lib/auth";
import type { MutationCtx } from "./_generated/server";
import { insertAnalyticsEvent } from "./lib/analytics";
import { assertStorageFileOwnership, linkStorageFile } from "./lib/storage";

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

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

async function upsertProvisionedUser(
  ctx: MutationCtx,
  input: {
    userId: string;
    fullName?: string;
    email?: string;
    imageUrl?: string;
  },
) {
  const timestamp = now();
  const fullName = normalizeOptionalString(input.fullName);
  const email = normalizeOptionalString(input.email);
  const imageUrl = normalizeOptionalString(input.imageUrl);
  const existingProfile = await getProfileByUserId(ctx, input.userId);

  if (!existingProfile) {
    await ctx.db.insert("profiles", {
      userId: input.userId,
      fullName,
      email,
      avatarUrl: imageUrl,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  } else {
    await ctx.db.patch(existingProfile._id, {
      fullName: fullName ?? existingProfile.fullName,
      email: email ?? existingProfile.email,
      avatarUrl: imageUrl ?? existingProfile.avatarUrl,
      updatedAt: timestamp,
    });
  }

  const employeeRole = await ctx.db
    .query("userRoles")
    .withIndex("by_userId_role", (q) => q.eq("userId", input.userId).eq("role", "employee"))
    .unique();
  if (!employeeRole) {
    await ctx.db.insert("userRoles", {
      userId: input.userId,
      role: "employee",
      createdAt: timestamp,
    });
  }

  await provisionLeaveBalances(ctx, input.userId);

  if (!existingProfile || !employeeRole) {
    await insertAnalyticsEvent(ctx, {
      eventName: "user_provisioned",
      sessionId: `system:${input.userId}`,
      userId: input.userId,
      roleScope: "employee",
      surface: "auth",
      properties: {
        created_profile: !existingProfile,
        created_employee_role: !employeeRole,
      },
    });
  }

  return {
    ok: true,
    userId: input.userId,
    createdProfile: !existingProfile,
    createdEmployeeRole: !employeeRole,
  };
}

export const ensureCurrentUser = mutation({
  args: {
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    return await upsertProvisionedUser(ctx, {
      userId: identity.subject,
      fullName: args.fullName ?? identity.name ?? undefined,
      email: args.email ?? identity.email ?? undefined,
      imageUrl: args.imageUrl ?? identity.pictureUrl ?? undefined,
    });
  },
});

export const provisionUserFromServer = internalMutation({
  args: {
    userId: v.string(),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    await upsertProvisionedUser(ctx, {
      userId: args.userId,
      fullName: args.fullName,
      email: args.email,
      imageUrl: args.imageUrl,
    }),
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

    await assertStorageFileOwnership(ctx, {
      storageId: args.storageId,
      ownerUserId: identity.subject,
      expectedClass: "avatar",
    });

    await ctx.db.patch(profile._id, {
      avatarStorageId: args.storageId,
      avatarUrl: args.url,
      updatedAt: now(),
    });

    await linkStorageFile(ctx, {
      storageId: args.storageId,
      ownerUserId: identity.subject,
      expectedClass: "avatar",
      linkedTable: "profiles",
      linkedRecordId: String(profile._id),
    });

    return { ok: true };
  },
});
