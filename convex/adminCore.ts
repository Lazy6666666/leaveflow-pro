import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { appRoleValidator } from "./constants";
import type { AppRole } from "./constants";
import { getEnv } from "./lib/env";
import { insertAnalyticsEvent } from "./lib/analytics";
import { getProfileByUserId, hasAuditDiff, now, recordAudit, requireAnyRole, requireIdentity } from "./lib/auth";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireAnyRole(ctx, ["hr_admin"]);
}

export const bootstrapAdmin = mutation({
  args: {
    setupToken: v.string(),
    analytics: v.optional(v.object({
      sessionId: v.string(),
      path: v.optional(v.string()),
      roleScope: v.optional(v.string()),
      surface: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const expectedToken = getEnv("ADMIN_SETUP_TOKEN");
    if (!expectedToken || args.setupToken !== expectedToken) {
      throw new Error("Invalid setup token");
    }

    const existingAdmins = await ctx.db.query("userRoles").withIndex("by_role", (q) => q.eq("role", "hr_admin")).collect();
    if (existingAdmins.length > 0) {
      throw new Error("An HR admin already exists");
    }

    const existingRoles = await ctx.db.query("userRoles").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).collect();
    const existingRoleNames = new Set(existingRoles.map((role) => role.role));
    for (const role of ["employee", "manager", "hr_admin"] as const) {
      if (!existingRoleNames.has(role)) {
        await ctx.db.insert("userRoles", { userId: identity.subject, role, createdAt: now() });
      }
    }

    if (args.analytics) {
      await insertAnalyticsEvent(ctx, {
        eventName: "admin_setup_completed",
        sessionId: args.analytics.sessionId,
        userId: identity.subject,
        roleScope: args.analytics.roleScope,
        path: args.analytics.path,
        surface: args.analytics.surface,
      });
    }

    return { message: "Successfully promoted to HR Admin!" };
  },
});

export const getHolidays = query({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const start = `${args.year}-01-01`;
    const end = `${args.year}-12-31`;
    const holidays = await ctx.db.query("publicHolidays").withIndex("by_date", (q) => q.gte("date", start).lte("date", end)).collect();
    return holidays.sort((a, b) => a.date.localeCompare(b.date)).map((holiday) => ({
      id: holiday._id,
      name: holiday.name,
      date: holiday.date,
      description: holiday.description ?? null,
      is_recurring: holiday.isRecurring,
      created_at: new Date(holiday.createdAt).toISOString(),
    }));
  },
});

export const saveHoliday = mutation({
  args: {
    holidayId: v.optional(v.id("publicHolidays")),
    name: v.string(),
    date: v.string(),
    description: v.optional(v.string()),
    isRecurring: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const payload = { name: args.name, date: args.date, description: args.description, isRecurring: args.isRecurring };

    if (!args.holidayId) {
      const holidayId = await ctx.db.insert("publicHolidays", { ...payload, createdAt: now() });
      await recordAudit(ctx, {
        tableName: "public_holidays",
        recordId: String(holidayId),
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(holidayId),
      });
      return { id: holidayId };
    }

    const current = await ctx.db.get(args.holidayId);
    await ctx.db.patch(args.holidayId, payload);
    await recordAudit(ctx, {
      tableName: "public_holidays",
      recordId: String(args.holidayId),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: current,
      newData: { ...current, ...payload },
    });
    return { id: args.holidayId };
  },
});

export const deleteHoliday = mutation({
  args: { holidayId: v.id("publicHolidays") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const current = await ctx.db.get(args.holidayId);
    if (!current) {
      throw new Error("Holiday not found");
    }
    await ctx.db.delete(args.holidayId);
    await recordAudit(ctx, {
      tableName: "public_holidays",
      recordId: String(args.holidayId),
      action: "DELETE",
      changedBy: identity.subject,
      oldData: current,
    });
    return { ok: true };
  },
});

export const getDepartments = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    const departments = await ctx.db.query("departments").collect();
    return departments.sort((a, b) => a.name.localeCompare(b.name)).map((department) => ({
      id: department._id,
      name: department.name,
      created_at: new Date(department.createdAt).toISOString(),
    }));
  },
});

export const saveDepartment = mutation({
  args: { departmentId: v.optional(v.id("departments")), name: v.string() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    if (!args.departmentId) {
      const departmentId = await ctx.db.insert("departments", { name: args.name, createdAt: now() });
      await recordAudit(ctx, {
        tableName: "departments",
        recordId: String(departmentId),
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(departmentId),
      });
      return { id: departmentId };
    }

    const current = await ctx.db.get(args.departmentId);
    await ctx.db.patch(args.departmentId, { name: args.name });
    await recordAudit(ctx, {
      tableName: "departments",
      recordId: String(args.departmentId),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: current,
      newData: { ...current, name: args.name },
    });
    return { id: args.departmentId };
  },
});

export const deleteDepartment = mutation({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const current = await ctx.db.get(args.departmentId);
    if (!current) {
      throw new Error("Department not found");
    }
    await ctx.db.delete(args.departmentId);
    await recordAudit(ctx, {
      tableName: "departments",
      recordId: String(args.departmentId),
      action: "DELETE",
      changedBy: identity.subject,
      oldData: current,
    });
    return { ok: true };
  },
});

export const getLeavePolicies = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    const leaveTypes = await ctx.db.query("leaveTypes").collect();
    return leaveTypes.sort((a, b) => a.name.localeCompare(b.name)).map((leaveType) => ({
      id: leaveType._id,
      name: leaveType.name,
      annual_allocation: leaveType.annualAllocation,
      carry_forward_limit: leaveType.carryForwardLimit,
      is_active: leaveType.isActive,
    }));
  },
});

export const saveLeaveType = mutation({
  args: {
    leaveTypeId: v.optional(v.id("leaveTypes")),
    name: v.string(),
    annualAllocation: v.number(),
    carryForwardLimit: v.number(),
    isActive: v.boolean(),
    analytics: v.optional(v.object({
      sessionId: v.string(),
      path: v.optional(v.string()),
      roleScope: v.optional(v.string()),
      surface: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const payload = {
      name: args.name,
      annualAllocation: args.annualAllocation,
      carryForwardLimit: args.carryForwardLimit,
      isActive: args.isActive,
    };

    if (!args.leaveTypeId) {
      const leaveTypeId = await ctx.db.insert("leaveTypes", { ...payload, createdAt: now() });
      await recordAudit(ctx, {
        tableName: "leave_types",
        recordId: String(leaveTypeId),
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(leaveTypeId),
      });
      if (args.analytics) {
        await insertAnalyticsEvent(ctx, {
          eventName: "leave_policy_saved",
          sessionId: args.analytics.sessionId,
          userId: identity.subject,
          roleScope: args.analytics.roleScope,
          path: args.analytics.path,
          surface: args.analytics.surface,
          properties: {
            is_active: args.isActive,
            allocation_days: args.annualAllocation,
          },
        });
      }
      return { id: leaveTypeId };
    }

    const current = await ctx.db.get(args.leaveTypeId);
    await ctx.db.patch(args.leaveTypeId, payload);
    await recordAudit(ctx, {
      tableName: "leave_types",
      recordId: String(args.leaveTypeId),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: current,
      newData: { ...current, ...payload },
    });
    if (args.analytics) {
      await insertAnalyticsEvent(ctx, {
        eventName: "leave_policy_saved",
        sessionId: args.analytics.sessionId,
        userId: identity.subject,
        roleScope: args.analytics.roleScope,
        path: args.analytics.path,
        surface: args.analytics.surface,
        properties: {
          is_active: args.isActive,
          allocation_days: args.annualAllocation,
        },
      });
    }
    return { id: args.leaveTypeId };
  },
});

export const getEmployeesData = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    const [departments, sites, roles] = await Promise.all([
      ctx.db.query("departments").collect(),
      ctx.db.query("sites").collect(),
      ctx.db.query("userRoles").collect(),
    ]);
    const departmentMap = new Map(departments.map((department) => [String(department._id), department] as const));
    const siteMap = new Map(sites.map((site) => [String(site._id), site] as const));

    return {
      employees: profiles.map((profile) => ({
        id: profile.userId,
        full_name: profile.fullName ?? null,
        email: profile.email ?? null,
        department_id: profile.departmentId ?? null,
        site_id: profile.siteId ?? null,
        manager_id: profile.managerUserId ?? null,
        hourly_rate: profile.hourlyRate ?? null,
        base_salary: profile.baseSalary ?? null,
        departments: profile.departmentId ? { name: departmentMap.get(String(profile.departmentId))?.name ?? null } : null,
        site: profile.siteId ? { id: String(profile.siteId), name: siteMap.get(String(profile.siteId))?.name ?? null } : null,
      })),
      roles: roles.map((role) => ({ user_id: role.userId, role: role.role })),
      departments: departments.map((department) => ({ id: department._id, name: department.name })),
      sites: sites.map((site) => ({ id: site._id, name: site.name })),
    };
  },
});

export const updateEmployee = mutation({
  args: {
    employeeId: v.string(),
    departmentId: v.optional(v.id("departments")),
    siteId: v.optional(v.id("sites")),
    managerId: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    baseSalary: v.optional(v.number()),
    role: appRoleValidator,
    analytics: v.optional(v.object({
      sessionId: v.string(),
      path: v.optional(v.string()),
      roleScope: v.optional(v.string()),
      surface: v.string(),
      changedFields: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const profile = await getProfileByUserId(ctx, args.employeeId);
    if (!profile) {
      throw new Error("Employee profile not found");
    }

    const profilePatch = {
      departmentId: args.departmentId,
      siteId: args.siteId,
      managerUserId: args.managerId,
      hourlyRate: args.hourlyRate,
      baseSalary: args.baseSalary,
      updatedAt: now(),
    };
    await ctx.db.patch(profile._id, profilePatch);

    const existingRoles = await ctx.db.query("userRoles").withIndex("by_userId", (q) => q.eq("userId", args.employeeId)).collect();
    const nextRoles: AppRole[] = ["employee"];
    if (args.role === "manager") nextRoles.push("manager");
    if (args.role === "hr_admin") nextRoles.push("manager", "hr_admin");
    const nextUniqueRoles = Array.from(new Set(nextRoles)).sort();
    const existingRoleNames = Array.from(new Set(existingRoles.map((roleDoc) => roleDoc.role))).sort();

    if (hasAuditDiff(existingRoleNames, nextUniqueRoles)) {
      await Promise.all(existingRoles.map((roleDoc) => ctx.db.delete(roleDoc._id)));
      for (const role of nextUniqueRoles) {
        await ctx.db.insert("userRoles", { userId: args.employeeId, role, createdAt: now() });
      }

      await recordAudit(ctx, {
        tableName: "user_roles",
        recordId: args.employeeId,
        action: "UPDATE",
        changedBy: identity.subject,
        oldData: existingRoleNames,
        newData: nextUniqueRoles,
      });
    }

    await recordAudit(ctx, {
      tableName: "profiles",
      recordId: String(profile._id),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: profile,
      newData: { ...profile, ...profilePatch },
    });

    if (args.analytics) {
      await insertAnalyticsEvent(ctx, {
        eventName: "employee_updated",
        sessionId: args.analytics.sessionId,
        userId: identity.subject,
        roleScope: args.analytics.roleScope,
        path: args.analytics.path,
        surface: args.analytics.surface,
        properties: {
          changed_fields: args.analytics.changedFields,
          target_role: args.role,
        },
      });
    }

    return { ok: true };
  },
});

export const deleteProvisionedUser = mutation({
  args: { employeeId: v.string() },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    if (args.employeeId === identity.subject) {
      throw new Error("You cannot delete your own account.");
    }

    const profile = await getProfileByUserId(ctx, args.employeeId);
    if (!profile) {
      throw new Error("Employee profile not found");
    }

    const roles = await ctx.db.query("userRoles").withIndex("by_userId", (q) => q.eq("userId", args.employeeId)).collect();
    if (roles.some((role) => role.role === "hr_admin")) {
      throw new Error("Refusing to delete an HR admin account.");
    }

    const leaveRequests = await ctx.db.query("leaveRequests").withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId)).collect();
    const attendanceLogs = await ctx.db.query("attendanceLogs").withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId)).collect();
    const badgeMappings = await ctx.db.query("badgeMappings").withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId)).collect();
    const delegationsAsManager = await ctx.db.query("managerDelegations").withIndex("by_managerId", (q) => q.eq("managerId", args.employeeId)).collect();
    const delegationsAsDelegate = await ctx.db.query("managerDelegations").withIndex("by_delegateId", (q) => q.eq("delegateId", args.employeeId)).collect();

    const blockers = {
      leaveRequests: leaveRequests.length,
      attendanceLogs: attendanceLogs.length,
      badgeMappings: badgeMappings.length,
      delegationsAsManager: delegationsAsManager.length,
      delegationsAsDelegate: delegationsAsDelegate.length,
    };

    if (Object.values(blockers).some((count) => count > 0)) {
      throw new Error(`Cannot delete employee with linked operational records: ${JSON.stringify(blockers)}`);
    }

    const leaveBalances = await ctx.db.query("leaveBalances").withIndex("by_employeeId_year", (q) => q.eq("employeeId", args.employeeId)).collect();
    const notifications = await ctx.db.query("notifications").withIndex("by_userId", (q) => q.eq("userId", args.employeeId)).collect();
    const storageFiles = await ctx.db.query("storageFiles").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", args.employeeId)).collect();

    for (const file of storageFiles) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete(file._id);
    }
    for (const notification of notifications) await ctx.db.delete(notification._id);
    for (const balance of leaveBalances) await ctx.db.delete(balance._id);
    for (const role of roles) await ctx.db.delete(role._id);

    await ctx.db.delete(profile._id);

    await recordAudit(ctx, {
      tableName: "profiles",
      recordId: String(profile._id),
      action: "DELETE",
      changedBy: identity.subject,
      oldData: {
        profile,
        roles: roles.map((role) => role.role),
        deletedLeaveBalanceCount: leaveBalances.length,
        deletedNotificationCount: notifications.length,
        deletedStorageFileCount: storageFiles.length,
      },
    });

    return {
      ok: true,
      employeeId: args.employeeId,
      deletedLeaveBalanceCount: leaveBalances.length,
      deletedNotificationCount: notifications.length,
      deletedStorageFileCount: storageFiles.length,
    };
  },
});
