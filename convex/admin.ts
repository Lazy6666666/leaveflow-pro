import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { appRoleValidator, biometricsVendorValidator } from "./constants";
import type { AppRole, BiometricsVendor } from "./constants";
import { getConvexSiteUrl, getEnv } from "./lib/env";
import {
  getProfileByUserId,
  now,
  recordAudit,
  hasAuditDiff,
  requireAnyRole,
  requireIdentity,
  vendorKey,
} from "./lib/auth";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import type { BiometricsConfigDoc } from "./lib/types";

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireAnyRole(ctx, ["hr_admin"]);
}

export const bootstrapAdmin = mutation({
  args: {
    setupToken: v.string(),
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
        await ctx.db.insert("userRoles", {
          userId: identity.subject,
          role,
          createdAt: now(),
        });
      }
    }

    return { message: "Successfully promoted to HR Admin!" };
  },
});

export const getHolidays = query({
  args: {
    year: v.number(),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const start = `${args.year}-01-01`;
    const end = `${args.year}-12-31`;
    const holidays = await ctx.db.query("publicHolidays").withIndex("by_date", (q) => q.gte("date", start).lte("date", end)).collect();
    return holidays
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((holiday) => ({
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
    const payload = {
      name: args.name,
      date: args.date,
      description: args.description,
      isRecurring: args.isRecurring,
    };

    if (!args.holidayId) {
      const holidayId = await ctx.db.insert("publicHolidays", {
        ...payload,
        createdAt: now(),
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
  args: {
    holidayId: v.id("publicHolidays"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.holidayId);
    return { ok: true };
  },
});

export const getDepartments = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    const departments = await ctx.db.query("departments").collect();
    return departments
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((department) => ({
        id: department._id,
        name: department.name,
        created_at: new Date(department.createdAt).toISOString(),
      }));
  },
});

export const saveDepartment = mutation({
  args: {
    departmentId: v.optional(v.id("departments")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    if (!args.departmentId) {
      const departmentId = await ctx.db.insert("departments", {
        name: args.name,
        createdAt: now(),
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
  args: {
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.departmentId);
    return { ok: true };
  },
});

export const getLeavePolicies = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    const leaveTypes = await ctx.db.query("leaveTypes").collect();
    return leaveTypes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((leaveType) => ({
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
      const leaveTypeId = await ctx.db.insert("leaveTypes", {
        ...payload,
        createdAt: now(),
      });
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
    return { id: args.leaveTypeId };
  },
});

export const getEmployeesData = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    const departments = await ctx.db.query("departments").collect();
    const roles = await ctx.db.query("userRoles").collect();
    const departmentMap = new Map(departments.map((department) => [String(department._id), department] as const));

    return {
      employees: profiles.map((profile) => ({
        id: profile.userId,
        full_name: profile.fullName ?? null,
        email: profile.email ?? null,
        department_id: profile.departmentId ?? null,
        manager_id: profile.managerUserId ?? null,
        hourly_rate: profile.hourlyRate ?? null,
        base_salary: profile.baseSalary ?? null,
        departments: profile.departmentId ? { name: departmentMap.get(String(profile.departmentId))?.name ?? null } : null,
      })),
      roles: roles.map((role) => ({
        user_id: role.userId,
        role: role.role,
      })),
      departments: departments.map((department) => ({ id: department._id, name: department.name })),
    };
  },
});

export const updateEmployee = mutation({
  args: {
    employeeId: v.string(),
    departmentId: v.optional(v.id("departments")),
    managerId: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    baseSalary: v.optional(v.number()),
    role: appRoleValidator,
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const profile = await getProfileByUserId(ctx, args.employeeId);
    if (!profile) {
      throw new Error("Employee profile not found");
    }

    const profilePatch = {
      departmentId: args.departmentId,
      managerUserId: args.managerId,
      hourlyRate: args.hourlyRate,
      baseSalary: args.baseSalary,
      updatedAt: now(),
    };
    await ctx.db.patch(profile._id, profilePatch);

    const existingRoles = await ctx.db.query("userRoles").withIndex("by_userId", (q) => q.eq("userId", args.employeeId)).collect();
    const nextRoles: AppRole[] = ["employee"];
    if (args.role === "manager") {
      nextRoles.push("manager");
    }
    if (args.role === "hr_admin") {
      nextRoles.push("manager", "hr_admin");
    }
    const nextUniqueRoles = Array.from(new Set(nextRoles)).sort();
    const existingRoleNames = Array.from(new Set(existingRoles.map((roleDoc) => roleDoc.role))).sort();

    if (hasAuditDiff(existingRoleNames, nextUniqueRoles)) {
      await Promise.all(existingRoles.map((roleDoc) => ctx.db.delete(roleDoc._id)));
      for (const role of nextUniqueRoles) {
        await ctx.db.insert("userRoles", {
          userId: args.employeeId,
          role,
          createdAt: now(),
        });
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

    return { ok: true };
  },
});

export const deleteProvisionedUser = mutation({
  args: {
    employeeId: v.string(),
  },
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

    const leaveBalances = await ctx.db
      .query("leaveBalances")
      .withIndex("by_employeeId_year", (q) => q.eq("employeeId", args.employeeId))
      .collect();
    const notifications = await ctx.db.query("notifications").withIndex("by_userId", (q) => q.eq("userId", args.employeeId)).collect();
    const storageFiles = await ctx.db
      .query("storageFiles")
      .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", args.employeeId))
      .collect();

    for (const file of storageFiles) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete(file._id);
    }

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    for (const balance of leaveBalances) {
      await ctx.db.delete(balance._id);
    }

    for (const role of roles) {
      await ctx.db.delete(role._id);
    }

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

export const getBalancesData = query({
  args: {
    employeeId: v.optional(v.string()),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    const leaveTypes = await ctx.db.query("leaveTypes").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
    const balances = args.employeeId
      ? await ctx.db
          .query("leaveBalances")
          .withIndex("by_employeeId_year", (q) => q.eq("employeeId", args.employeeId).eq("year", args.year))
          .collect()
      : [];

    return {
      employees: profiles
        .slice()
        .sort((a, b) => (a.fullName ?? a.email ?? "").localeCompare(b.fullName ?? b.email ?? ""))
        .map((profile) => ({
          id: profile.userId,
          full_name: profile.fullName ?? null,
          email: profile.email ?? null,
        })),
      leaveTypes: leaveTypes.map((leaveType) => ({
        id: leaveType._id,
        name: leaveType.name,
        annual_allocation: leaveType.annualAllocation,
      })),
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
  args: {
    balanceId: v.id("leaveBalances"),
    balance: v.number(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const current = await ctx.db.get(args.balanceId);
    await ctx.db.patch(args.balanceId, {
      balance: args.balance,
      updatedAt: now(),
    });
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
  args: {
    employeeId: v.string(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const leaveTypes = await ctx.db.query("leaveTypes").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
    for (const leaveType of leaveTypes) {
      const existing = await ctx.db
        .query("leaveBalances")
        .withIndex("by_employeeId_leaveType_year", (q) =>
          q.eq("employeeId", args.employeeId).eq("leaveTypeId", leaveType._id).eq("year", args.year),
        )
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
  args: {
    year: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    for (const profile of profiles) {
      await initializeEmployeeBalancesHandler(ctx, profile.userId, args.year);
    }
    return { ok: true, totalEmployees: profiles.length };
  },
});

async function initializeEmployeeBalancesHandler(ctx: MutationCtx, employeeId: string, year: number) {
  const leaveTypes = await ctx.db.query("leaveTypes").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
  for (const leaveType of leaveTypes) {
    const existing = await ctx.db
      .query("leaveBalances")
      .withIndex("by_employeeId_leaveType_year", (q) =>
        q.eq("employeeId", employeeId).eq("leaveTypeId", leaveType._id).eq("year", year),
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("leaveBalances", {
        employeeId,
        leaveTypeId: leaveType._id,
        year,
        balance: leaveType.annualAllocation,
        createdAt: now(),
        updatedAt: now(),
      });
    }
  }
}

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
        .map((profile) => ({
          id: profile.userId,
          full_name: profile.fullName ?? null,
          email: profile.email ?? null,
        })),
    };
  },
});

export const saveBadgeMapping = mutation({
  args: {
    employeeId: v.string(),
    badgeId: v.string(),
    vendor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const existing = await ctx.db
      .query("badgeMappings")
      .withIndex("by_vendorKey", (q) => q.eq("vendorKey", vendorKey(args.badgeId, args.vendor)))
      .unique();
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
    mappings: v.array(
      v.object({
        employeeId: v.string(),
        badgeId: v.string(),
        vendor: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const insertedIds = [];
    for (const mapping of args.mappings) {
      const existing = await ctx.db
        .query("badgeMappings")
        .withIndex("by_vendorKey", (q) => q.eq("vendorKey", vendorKey(mapping.badgeId, mapping.vendor)))
        .unique();
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
  args: {
    mappingId: v.id("badgeMappings"),
  },
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

type BiometricsAttendanceRecord = {
  employee_identifier: string;
  timestamp: string;
  type: "in" | "out";
  device_serial?: string;
};

type VendorConnectionConfig = Pick<
  BiometricsConfigDoc,
  "_id" | "vendor" | "name" | "apiUrl" | "apiKey" | "apiSecret" | "webhookSecret" | "lastSyncRecords"
>;

type VendorAdapter = {
  testConnection: (config: VendorConnectionConfig) => Promise<{ success: boolean; message: string }>;
  fetchLogs: (config: VendorConnectionConfig, date: string) => Promise<BiometricsAttendanceRecord[]>;
};

type WebhookRecord = Record<string, unknown>;

function isRecord(value: unknown): value is WebhookRecord {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getBasicAuthHeader(username?: string | null, password?: string | null) {
  if (!username) {
    return undefined;
  }

  return `Basic ${btoa(`${username}:${password ?? ""}`)}`;
}

function toOptionalString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function inferPunchType(value: unknown) {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (
      normalized.includes("out") ||
      normalized.includes("exit") ||
      normalized.includes("checkout") ||
      normalized.includes("clock_out")
    ) {
      return "out" as const;
    }
    return "in" as const;
  }

  return value === 0 || value === "0" ? "in" : "out";
}

function normalizeWebhookRecords(payload: unknown): BiometricsAttendanceRecord[] {
  const rawRecords = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.records)
      ? payload.records
      : isRecord(payload) && Array.isArray(payload.events)
        ? payload.events
        : isRecord(payload) && Array.isArray(payload.payload)
          ? payload.payload
          : isRecord(payload) && payload.payload
            ? [payload.payload]
            : payload
              ? [payload]
              : [];

  return rawRecords.flatMap((rawRecord) => {
    if (!isRecord(rawRecord)) {
      return [];
    }

    const identifier = rawRecord.employee_identifier ??
      rawRecord.employeeIdentifier ??
      rawRecord.emp_code ??
      rawRecord.employee_code ??
      rawRecord.badge_id ??
      rawRecord.badgeId ??
      rawRecord.pin ??
      rawRecord.cardNo ??
      rawRecord.employeeNoString ??
      rawRecord.user_id ??
      rawRecord.userId;
    const timestamp = rawRecord.timestamp ??
      rawRecord.punch_time ??
      rawRecord.att_date ??
      rawRecord.datetime ??
      rawRecord.time ??
      rawRecord.event_time ??
      rawRecord.occurred_at;

    if (!identifier || !timestamp) {
      return [];
    }

    const normalizedTime = Date.parse(String(timestamp));
    if (Number.isNaN(normalizedTime)) {
      return [];
    }

    return [{
      employee_identifier: String(identifier),
      timestamp: new Date(normalizedTime).toISOString(),
      type: inferPunchType(rawRecord.type ?? rawRecord.direction ?? rawRecord.event_type ?? rawRecord.punch_state),
      device_serial: toOptionalString(
        rawRecord.device_serial ??
        rawRecord.deviceSerial ??
        rawRecord.terminal_sn ??
        rawRecord.terminal ??
        rawRecord.deviceName ??
        rawRecord.device_id,
      ),
    }];
  });
}

const zktecoAdapter: VendorAdapter = {
  async testConnection(config) {
    try {
      const response = await fetch(`${config.apiUrl}/iclock/api/terminals/`, {
        headers: { Authorization: `Token ${config.apiKey}` },
      });
      return response.ok
        ? { success: true, message: `Connected to ZKTeco at ${config.apiUrl}` }
        : { success: false, message: `ZKTeco responded with status ${response.status}` };
    } catch (error: unknown) {
      return { success: false, message: `Cannot reach ZKTeco server: ${getErrorMessage(error)}` };
    }
  },
  async fetchLogs(config, date) {
    const response = await fetch(
      `${config.apiUrl}/iclock/api/transactions/?start_time=${date} 00:00:00&end_time=${date} 23:59:59&page_size=1000`,
      { headers: { Authorization: `Token ${config.apiKey}` } },
    );
    if (!response.ok) {
      throw new Error(`ZKTeco API error: ${response.status}`);
    }

    const payload = await response.json();
    const dataRecords = Array.isArray(payload.data) ? payload.data : undefined;
    const resultRecords = Array.isArray(payload.results) ? payload.results : undefined;
    const records = dataRecords ?? resultRecords ?? [];

    return records.flatMap((record) => {
      if (!isRecord(record)) {
        return [];
      }

      const timestamp = record.punch_time ?? record.att_date;
      if (timestamp === undefined || timestamp === null) {
        return [];
      }

      return [
        {
          employee_identifier: String(record.emp_code ?? record.pin ?? ""),
          timestamp: new Date(String(timestamp)).toISOString(),
          type: inferPunchType(record.punch_state),
          device_serial: typeof record.terminal_sn === "string" ? record.terminal_sn : undefined,
        },
      ];
    });
  },
};

const biotimeAdapter: VendorAdapter = {
  async testConnection(config) {
    try {
      const response = await fetch(`${config.apiUrl}/api/v1/device/`, {
        headers: { "Content-Type": "application/json", Authorization: `JWT ${config.apiKey}` },
      });
      return response.ok
        ? { success: true, message: `Connected to BioTime at ${config.apiUrl}` }
        : { success: false, message: `BioTime responded with status ${response.status}` };
    } catch (error: unknown) {
      return { success: false, message: `Cannot reach BioTime: ${getErrorMessage(error)}` };
    }
  },
  async fetchLogs(config, date) {
    const response = await fetch(
      `${config.apiUrl}/api/v1/transactions/?start_time=${date}&end_time=${date}&page_size=1000`,
      { headers: { Authorization: `JWT ${config.apiKey}` } },
    );
    if (!response.ok) {
      throw new Error(`BioTime API error: ${response.status}`);
    }

    const payload = await response.json();
    const records = Array.isArray(payload.data) ? payload.data : [];
    return records.flatMap((record) => {
      if (!isRecord(record) || typeof record.emp_code !== "string" || typeof record.punch_time !== "string") {
        return [];
      }
      return [{
        employee_identifier: record.emp_code,
        timestamp: new Date(record.punch_time).toISOString(),
        type: inferPunchType(record.punch_state),
        device_serial: typeof record.terminal_sn === "string" ? record.terminal_sn : undefined,
      }];
    });
  },
};
const supremaAdapter: VendorAdapter = {
  async testConnection(config) {
    try {
      const response = await fetch(`${config.apiUrl}/api/v2/server/info`, {
        headers: { "bs-session-id": config.apiKey },
      });
      return response.ok
        ? { success: true, message: "Connected to Suprema BioStar 2" }
        : { success: false, message: `Suprema responded with status ${response.status}` };
    } catch (error: unknown) {
      return { success: false, message: `Cannot reach Suprema: ${getErrorMessage(error)}` };
    }
  },
  async fetchLogs(config, date) {
    const response = await fetch(`${config.apiUrl}/api/v2/events/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "bs-session-id": config.apiKey },
      body: JSON.stringify({
        Query: {
          limit: 1000,
          conditions: [
            { column: "datetime", operator: 2, values: [`${date}T00:00:00`] },
            { column: "datetime", operator: 3, values: [`${date}T23:59:59`] },
          ],
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`Suprema API error: ${response.status}`);
    }

    const payload = await response.json();
    const rows = isRecord(payload.EventCollection) && Array.isArray(payload.EventCollection.rows)
      ? payload.EventCollection.rows
      : [];
    return rows.flatMap((record) => {
      if (!isRecord(record)) return [];
      const userValue = isRecord(record.user_id) ? record.user_id.user_id : record.user_id;
      if ((typeof userValue !== "string" && typeof userValue !== "number") || typeof record.datetime !== "string") {
        return [];
      }
      const deviceId = isRecord(record.device_id) ? record.device_id.id : undefined;
      const eventType = isRecord(record.event_type_id) ? record.event_type_id.code : undefined;
      return [{
        employee_identifier: String(userValue),
        timestamp: new Date(record.datetime).toISOString(),
        type: inferPunchType(eventType),
        device_serial: typeof deviceId === "string" || typeof deviceId === "number" ? String(deviceId) : undefined,
      }];
    });
  },
};

const hikvisionAdapter: VendorAdapter = {
  async testConnection(config) {
    try {
      const response = await fetch(`${config.apiUrl}/ISAPI/System/deviceInfo`, {
        headers: { Authorization: getBasicAuthHeader(config.apiKey, config.apiSecret) ?? "" },
      });
      return response.ok
        ? { success: true, message: "Connected to HikVision device" }
        : { success: false, message: `HikVision responded with status ${response.status}` };
    } catch (error: unknown) {
      return { success: false, message: `Cannot reach HikVision: ${getErrorMessage(error)}` };
    }
  },
  async fetchLogs(config, date) {
    const response = await fetch(`${config.apiUrl}/ISAPI/AccessControl/AcsEvent?format=json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getBasicAuthHeader(config.apiKey, config.apiSecret) ?? "",
      },
      body: JSON.stringify({
        AcsEventCond: {
          searchID: crypto.randomUUID(),
          searchResultPosition: 0,
          maxResults: 1000,
          startTime: `${date}T00:00:00Z`,
          endTime: `${date}T23:59:59Z`,
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`HikVision API error: ${response.status}`);
    }

    const payload = await response.json();
    const records = isRecord(payload.AcsEvent) && Array.isArray(payload.AcsEvent.InfoList)
      ? payload.AcsEvent.InfoList
      : [];
    return records.flatMap((record) => {
      if (!isRecord(record)) return [];
      const identifier = record.employeeNoString ?? record.cardNo;
      if ((typeof identifier !== "string" && typeof identifier !== "number") || typeof record.time !== "string") {
        return [];
      }
      return [{
        employee_identifier: String(identifier),
        timestamp: new Date(record.time).toISOString(),
        type: inferPunchType(record.currentEvent),
        device_serial: typeof record.deviceName === "string" ? record.deviceName : undefined,
      }];
    });
  },
};

type SupportedPullVendor = Exclude<BiometricsVendor, "generic_webhook">;

const biometricsAdapters: Record<SupportedPullVendor, VendorAdapter> = {
  zkteco: zktecoAdapter,
  biotime: biotimeAdapter,
  suprema: supremaAdapter,
  hikvision: hikvisionAdapter,
};

async function requireAdminAction(ctx: ActionCtx) {
  const currentUser = await ctx.runQuery(api.users.current, {});
  if (!currentUser || !currentUser.roles.includes("hr_admin")) {
    throw new Error("Forbidden");
  }
  return currentUser;
}

function isBiometricsSyncDue(config: BiometricsConfigDoc, currentTimestamp: number) {
  if (config.vendor === "generic_webhook") {
    return false;
  }

  if (!config.lastSyncAt) {
    return true;
  }

  const syncFrequencyMinutes = Math.max(1, Math.floor(config.syncFrequencyMinutes));
  return currentTimestamp - config.lastSyncAt >= syncFrequencyMinutes * 60_000;
}

async function syncBiometricsConfig(ctx: ActionCtx, config: BiometricsConfigDoc) {
  if (config.vendor === "generic_webhook") {
    await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, {
      configId: config._id,
      status: "awaiting_webhook",
      records: config.lastSyncRecords ?? 0,
    });
    return {
      success: true,
      total_synced: 0,
      message: "Generic webhook devices push attendance events to /biometrics/webhook; manual pull sync is not available.",
    };
  }

  const adapter = biometricsAdapters[config.vendor];
  if (!adapter) {
    throw new Error(`No adapter configured for vendor ${config.vendor}`);
  }

  const syncDate = new Date().toISOString().slice(0, 10);

  try {
    await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, {
      configId: config._id,
      status: "syncing",
      records: config.lastSyncRecords ?? 0,
    });
    const records = await adapter.fetchLogs(config, syncDate);
    const result = await ctx.runMutation(internal.admin.ingestBiometricsRecordsInternal, {
      configId: config._id,
      source: config.vendor,
      records,
    });

    return {
      success: true,
      total_synced: result.processed,
      unmatched: result.unmatched,
      message: `Processed ${result.processed} attendance record${result.processed === 1 ? "" : "s"}${result.unmatched ? ` (${result.unmatched} unmatched)` : ""}.`,
    };
  } catch (error: unknown) {
    await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, {
      configId: config._id,
      status: `error:${getErrorMessage(error)}`,
      records: 0,
    });
    throw error;
  }
}

export const getBiometricsConfigInternal = internalQuery({
  args: {
    configId: v.id("biometricsConfigs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.configId);
  },
});

export const listActiveBiometricsConfigsInternal = internalQuery({
  args: {},
  handler: async (ctx) =>
    await ctx.db.query("biometricsConfigs").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect(),
});

export const getWebhookBiometricsConfigInternal = internalQuery({
  args: {
    vendor: v.optional(v.string()),
    webhookSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const configs = await ctx.db.query("biometricsConfigs").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
    const requestedVendor = args.vendor === "generic" ? "generic_webhook" : args.vendor;

    return configs.find((config) =>
      (!requestedVendor || config.vendor === requestedVendor) &&
      (!args.webhookSecret || config.webhookSecret === args.webhookSecret),
    ) ?? null;
  },
});

export const setBiometricsSyncStatusInternal = internalMutation({
  args: {
    configId: v.id("biometricsConfigs"),
    status: v.string(),
    records: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.configId, {
      lastSyncAt: now(),
      lastSyncStatus: args.status,
      lastSyncRecords: args.records,
      updatedAt: now(),
    });
  },
});

export const ingestBiometricsRecordsInternal = internalMutation({
  args: {
    configId: v.id("biometricsConfigs"),
    source: v.string(),
    records: v.array(v.object({
      employee_identifier: v.string(),
      timestamp: v.string(),
      type: v.union(v.literal("in"), v.literal("out")),
      device_serial: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) {
      throw new Error("Biometrics config not found");
    }

    const profiles = await ctx.db.query("profiles").collect();
    const profileByIdentifier = new Map<string, string>();
    for (const profile of profiles) {
      profileByIdentifier.set(profile.userId.toLowerCase(), profile.userId);
      if (profile.email) {
        profileByIdentifier.set(profile.email.toLowerCase(), profile.userId);
      }
      if (profile.fullName) {
        profileByIdentifier.set(profile.fullName.toLowerCase(), profile.userId);
      }
    }

    let processed = 0;
    let unmatched = 0;
    const changedBy = `system:biometrics:${String(args.configId)}`;

    for (const record of args.records) {
      const identifier = record.employee_identifier.trim();
      const normalizedIdentifier = identifier.toLowerCase();
      const badgeSpecific = await ctx.db
        .query("badgeMappings")
        .withIndex("by_vendorKey", (q) => q.eq("vendorKey", vendorKey(identifier, config.vendor)))
        .unique();
      const badgeUniversal = badgeSpecific ?? await ctx.db
        .query("badgeMappings")
        .withIndex("by_vendorKey", (q) => q.eq("vendorKey", vendorKey(identifier)))
        .unique();

      const employeeId = badgeUniversal?.employeeId ?? profileByIdentifier.get(normalizedIdentifier);
      if (!employeeId) {
        unmatched += 1;
        continue;
      }

      const eventTimestamp = new Date(record.timestamp).getTime();
      if (Number.isNaN(eventTimestamp)) {
        unmatched += 1;
        continue;
      }

      const recordDate = new Date(record.timestamp).toISOString().slice(0, 10);
      const existing = await ctx.db
        .query("attendanceLogs")
        .withIndex("by_employeeId_date", (q) => q.eq("employeeId", employeeId).eq("date", recordDate))
        .unique();

      const nextClockIn = record.type === "in"
        ? Math.min(existing?.clockIn ?? eventTimestamp, eventTimestamp)
        : existing?.clockIn;
      const nextClockOut = record.type === "out"
        ? Math.max(existing?.clockOut ?? eventTimestamp, eventTimestamp)
        : existing?.clockOut;

      const patch = {
        employeeId,
        date: recordDate,
        clockIn: nextClockIn,
        clockOut: nextClockOut,
        status: "present" as const,
        source: args.source,
        notes: `Synced from ${config.name}${record.device_serial ? ` (${record.device_serial})` : ""}`,
        updatedAt: now(),
      };

      if (existing) {
        const nextState = { ...existing, ...patch };
        if (hasAuditDiff(existing, nextState)) {
          await ctx.db.patch(existing._id, patch);
          await recordAudit(ctx, {
            tableName: "attendance_logs",
            recordId: String(existing._id),
            action: "UPDATE",
            changedBy,
            oldData: existing,
            newData: nextState,
          });
        }
      } else {
        const logId = await ctx.db.insert("attendanceLogs", {
          ...patch,
          createdAt: now(),
        });
        await recordAudit(ctx, {
          tableName: "attendance_logs",
          recordId: String(logId),
          action: "INSERT",
          changedBy,
          newData: await ctx.db.get(logId),
        });
      }

      processed += 1;
    }

    await ctx.db.patch(args.configId, {
      lastSyncAt: now(),
      lastSyncStatus: unmatched > 0 ? `success_with_unmatched:${unmatched}` : "success",
      lastSyncRecords: processed,
      updatedAt: now(),
    });

    return { processed, unmatched };
  },
});

export const getBiometricsConfigs = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const configs = await ctx.db.query("biometricsConfigs").collect();
    return configs
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((config) => ({
        id: config._id,
        vendor: config.vendor,
        name: config.name,
        api_url: config.apiUrl ?? null,
        device_serial: config.deviceSerial ?? null,
        location_name: config.locationName ?? null,
        sync_frequency_minutes: config.syncFrequencyMinutes,
        is_active: config.isActive,
        last_sync_at: config.lastSyncAt ? new Date(config.lastSyncAt).toISOString() : null,
        last_sync_status: config.lastSyncStatus ?? null,
        last_sync_records: config.lastSyncRecords ?? null,
        has_api_key: !!config.apiKey,
        has_api_secret: !!config.apiSecret,
        has_webhook_secret: !!config.webhookSecret,
        extra_config: config.extraConfig ?? {},
        created_at: new Date(config.createdAt).toISOString(),
        updated_at: new Date(config.updatedAt).toISOString(),
      }));
  },
});

export const saveBiometricsConfig = mutation({
  args: {
    vendor: biometricsVendorValidator,
    name: v.string(),
    apiUrl: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    apiSecret: v.optional(v.string()),
    webhookSecret: v.optional(v.string()),
    deviceSerial: v.optional(v.string()),
    locationName: v.optional(v.string()),
    syncFrequencyMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    if (args.vendor === "generic_webhook" && !args.webhookSecret?.trim()) {
      throw new Error("Webhook secret is required for generic webhook devices");
    }
    const configId = await ctx.db.insert("biometricsConfigs", {
      vendor: args.vendor,
      name: args.name,
      apiUrl: args.apiUrl,
      apiKey: args.apiKey,
      apiSecret: args.apiSecret,
      webhookSecret: args.webhookSecret,
      deviceSerial: args.deviceSerial,
      locationName: args.locationName,
      syncFrequencyMinutes: args.syncFrequencyMinutes,
      isActive: false,
      createdAt: now(),
      updatedAt: now(),
    });
    await recordAudit(ctx, {
      tableName: "biometrics_configs",
      recordId: String(configId),
      action: "INSERT",
      changedBy: identity.subject,
      newData: await ctx.db.get(configId),
    });
    return { id: configId };
  },
});

export const toggleBiometricsConfig = mutation({
  args: {
    configId: v.id("biometricsConfigs"),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const config = await ctx.db.get(args.configId);
    if (!config) {
      throw new Error("Biometrics config not found");
    }
    if (!config.isActive && config.vendor === "generic_webhook" && !config.webhookSecret) {
      throw new Error("Generic webhook devices require a configured webhook secret before activation");
    }
    const nextState = {
      ...config,
      isActive: !config.isActive,
      updatedAt: now(),
    };
    await ctx.db.patch(args.configId, { isActive: nextState.isActive, updatedAt: nextState.updatedAt });
    await recordAudit(ctx, {
      tableName: "biometrics_configs",
      recordId: String(args.configId),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: config,
      newData: nextState,
    });
    return { ok: true };
  },
});

export const deleteBiometricsConfig = mutation({
  args: {
    configId: v.id("biometricsConfigs"),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const current = await ctx.db.get(args.configId);
    if (!current) {
      throw new Error("Biometrics config not found");
    }
    await ctx.db.delete(args.configId);
    await recordAudit(ctx, {
      tableName: "biometrics_configs",
      recordId: String(args.configId),
      action: "DELETE",
      changedBy: identity.subject,
      oldData: current,
    });
    return { ok: true };
  },
});

export const testBiometricsConnection = action({
  args: {
    configId: v.id("biometricsConfigs"),
  },
  handler: async (ctx, args) => {
    await requireAdminAction(ctx);
    const config = await ctx.runQuery(internal.admin.getBiometricsConfigInternal, { configId: args.configId });
    if (!config) {
      throw new Error("Biometrics config not found");
    }

    if (config.vendor === "generic_webhook") {
      const convexSiteUrl = getConvexSiteUrl();
      if (!convexSiteUrl) {
        await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, {
          configId: args.configId,
          status: "configuration_required",
          records: config.lastSyncRecords ?? 0,
        });
        return {
          success: false,
          message: "Set CONVEX_SITE_URL (preferred) or VITE_CONVEX_SITE_URL before testing the generic biometrics webhook endpoint.",
        };
      }

      const message = `Generic webhook is ready. Send POST requests to ${convexSiteUrl}/biometrics/webhook${config.webhookSecret ? " with the configured secret header." : "."}`;
      await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, {
        configId: args.configId,
        status: "connected",
        records: config.lastSyncRecords ?? 0,
      });
      return { success: true, message };
    }

    const adapter = biometricsAdapters[config.vendor];
    if (!adapter) {
      throw new Error(`No adapter configured for vendor ${config.vendor}`);
    }

    const result = await adapter.testConnection(config);
    await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, {
      configId: args.configId,
      status: result.success ? "connected" : "connection_failed",
      records: config.lastSyncRecords ?? 0,
    });
    return result;
  },
});

export const syncBiometrics = action({
  args: {
    configId: v.id("biometricsConfigs"),
  },
  handler: async (ctx, args) => {
    await requireAdminAction(ctx);
    const config = await ctx.runQuery(internal.admin.getBiometricsConfigInternal, { configId: args.configId });
    if (!config) {
      throw new Error("Biometrics config not found");
    }

    return await syncBiometricsConfig(ctx, config);
  },
});

export const runScheduledBiometricsSync = internalAction({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.runQuery(internal.admin.listActiveBiometricsConfigsInternal, {});
    const currentTimestamp = now();
    const dueConfigs = configs.filter((config) => isBiometricsSyncDue(config, currentTimestamp));
    const results: Array<{
      configId: string;
      vendor: BiometricsVendor;
      success: boolean;
      total_synced?: number;
      unmatched?: number;
      message: string;
    }> = [];

    for (const config of dueConfigs) {
      try {
        const result = await syncBiometricsConfig(ctx, config);
        results.push({
          configId: String(config._id),
          vendor: config.vendor,
          success: result.success,
          total_synced: result.total_synced,
          unmatched: result.unmatched,
          message: result.message,
        });
      } catch (error: unknown) {
        results.push({
          configId: String(config._id),
          vendor: config.vendor,
          success: false,
          message: getErrorMessage(error),
        });
      }
    }

    return {
      checked: configs.length,
      due: dueConfigs.length,
      synced: results.filter((result) => result.success).length,
      results,
    };
  },
});

export const ingestBiometricsWebhook = internalAction({
  args: {
    payload: v.any(),
    vendor: v.optional(v.string()),
    webhookSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const config = await ctx.runQuery(internal.admin.getWebhookBiometricsConfigInternal, {
      vendor: args.vendor,
      webhookSecret: args.webhookSecret,
    });

    if (!config) {
      return {
        success: false,
        status: 404,
        message: "No active biometrics config matched the incoming webhook.",
      };
    }

    if (!config.webhookSecret) {
      return {
        success: false,
        status: 401,
        message: "Webhook secret is required for biometrics webhook ingestion.",
      };
    }

    if (config.webhookSecret !== args.webhookSecret) {
      return {
        success: false,
        status: 401,
        message: "Webhook secret did not match the configured device.",
      };
    }

    const records = normalizeWebhookRecords(args.payload);
    if (records.length === 0) {
      await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, {
        configId: config._id,
        status: "webhook_ignored",
        records: 0,
      });
      return {
        success: false,
        status: 400,
        message: "Webhook payload did not contain any recognizable attendance records.",
      };
    }

    const result = await ctx.runMutation(internal.admin.ingestBiometricsRecordsInternal, {
      configId: config._id,
      source: config.vendor,
      records,
    });

    return {
      success: true,
      status: 202,
      configId: String(config._id),
      vendor: config.vendor,
      processed: result.processed,
      unmatched: result.unmatched,
      received: records.length,
    };
  },
});

export const getAuditLogData = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const logs = await ctx.db.query("auditLogs").collect();
    return logs
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 500)
      .map((log) => ({
        id: log._id,
        table_name: log.tableName,
        record_id: log.recordId,
        action: log.action,
        changed_by: log.changedBy ?? null,
        old_data: log.oldData ?? null,
        new_data: log.newData ?? null,
        created_at: new Date(log.createdAt).toISOString(),
      }));
  },
});

export const getReportsData = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const leaveRequests = await ctx.db.query("leaveRequests").collect();
    const attendanceLogs = await ctx.db.query("attendanceLogs").collect();

    const statusMap: Record<string, number> = {};
    const typeMap: Record<string, number> = {};
    const monthMap: Record<string, number> = {};
    const attendanceMap: Record<string, number> = {};

    for (const leaveRequest of leaveRequests) {
      statusMap[leaveRequest.status] = (statusMap[leaveRequest.status] ?? 0) + 1;
      const leaveType = await ctx.db.get(leaveRequest.leaveTypeId);
      const leaveTypeName = leaveType?.name ?? "Unknown";
      typeMap[leaveTypeName] = (typeMap[leaveTypeName] ?? 0) + 1;
      const createdAt = new Date(leaveRequest.createdAt);
      const month = createdAt.toLocaleString("default", { month: "short", year: "numeric" });
      monthMap[month] = (monthMap[month] ?? 0) + 1;
    }

    for (const log of attendanceLogs) {
      const status = log.status.replace("_", " ");
      attendanceMap[status] = (attendanceMap[status] ?? 0) + 1;
    }

    return {
      statusData: Object.entries(statusMap).map(([name, count]) => ({ name, count })),
      typeData: Object.entries(typeMap).map(([name, count]) => ({ name, count })),
      monthlyData: Object.entries(monthMap).map(([month, requests]) => ({ month, requests })),
      attendanceData: Object.entries(attendanceMap).map(([name, count]) => ({ name, count })),
    };
  },
});


