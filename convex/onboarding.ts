import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

import { now, recordAudit, requireAnyRole } from "./lib/auth";

const assignmentStatusValidator = v.union(v.literal("not_started"), v.literal("in_progress"), v.literal("completed"));

const templateTaskValidator = v.object({
  id: v.string(),
  title: v.string(),
});

const assignmentTaskValidator = v.object({
  completedAt: v.optional(v.number()),
  id: v.string(),
  title: v.string(),
});

async function requireOnboardingAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireAnyRole(ctx, ["hr_admin"]);
}

export const getOnboardingData = query({
  args: {},
  handler: async (ctx) => {
    const { identity, roles } = await requireAnyRole(ctx, ["employee", "manager", "hr_admin"]);
    const [templates, assignments, profiles] = await Promise.all([
      ctx.db.query("onboardingTemplates").collect(),
      ctx.db.query("onboardingAssignments").collect(),
      ctx.db.query("profiles").collect(),
    ]);

    const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));
    const visibleAssignments = roles.includes("hr_admin")
      ? assignments
      : assignments.filter(
          (assignment) => assignment.assigneeUserId === identity.subject || assignment.managerUserId === identity.subject,
        );
    const visibleTemplateIds = new Set(visibleAssignments.map((assignment) => String(assignment.templateId)));
    const visibleAssigneeIds = new Set<string>();
    for (const assignment of visibleAssignments) {
      visibleAssigneeIds.add(assignment.assigneeUserId);
      if (assignment.managerUserId) {
        visibleAssigneeIds.add(assignment.managerUserId);
      }
    }
    visibleAssigneeIds.add(identity.subject);

    return {
      assignments: visibleAssignments
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map((assignment) => ({
          assigneeUserId: assignment.assigneeUserId,
          assigneeName: profileMap.get(assignment.assigneeUserId)?.fullName ?? assignment.assigneeUserId,
          id: assignment._id,
          managerUserId: assignment.managerUserId ?? null,
          status: assignment.status,
          tasks: assignment.tasks,
          templateId: assignment.templateId,
          updatedAt: new Date(assignment.updatedAt).toISOString(),
        })),
      profiles: (roles.includes("hr_admin") ? profiles : profiles.filter((profile) => visibleAssigneeIds.has(profile.userId))).map((profile) => ({
        fullName: profile.fullName ?? profile.userId,
        userId: profile.userId,
      })),
      templates: (roles.includes("hr_admin")
        ? templates
        : templates.filter((template) => visibleTemplateIds.has(String(template._id))))
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map((template) => ({
          description: template.description ?? "",
          id: template._id,
          name: template.name,
          tasks: template.tasks,
          updatedAt: new Date(template.updatedAt).toISOString(),
        })),
    };
  },
});

export const saveTemplate = mutation({
  args: {
    description: v.optional(v.string()),
    name: v.string(),
    tasks: v.array(templateTaskValidator),
    templateId: v.optional(v.id("onboardingTemplates")),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireOnboardingAdmin(ctx);
    const payload = {
      description: args.description,
      name: args.name,
      tasks: args.tasks,
      updatedAt: now(),
    };

    if (!args.templateId) {
      const templateId = await ctx.db.insert("onboardingTemplates", {
        ...payload,
        createdAt: now(),
        createdBy: identity.subject,
      });
      await recordAudit(ctx, {
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(templateId),
        recordId: String(templateId),
        tableName: "onboarding_templates",
      });
      return { id: templateId };
    }

    const current = await ctx.db.get(args.templateId);
    await ctx.db.patch(args.templateId, payload);
    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...current, ...payload },
      oldData: current,
      recordId: String(args.templateId),
      tableName: "onboarding_templates",
    });
    return { id: args.templateId };
  },
});

export const assignTemplate = mutation({
  args: {
    assigneeUserId: v.string(),
    managerUserId: v.optional(v.string()),
    templateId: v.id("onboardingTemplates"),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireOnboardingAdmin(ctx);
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const assignmentId = await ctx.db.insert("onboardingAssignments", {
      assigneeUserId: args.assigneeUserId,
      createdAt: now(),
      createdBy: identity.subject,
      managerUserId: args.managerUserId,
      status: "not_started",
      tasks: template.tasks.map((task) => ({ ...task, completedAt: undefined })),
      templateId: args.templateId,
      updatedAt: now(),
    });
    await recordAudit(ctx, {
      action: "INSERT",
      changedBy: identity.subject,
      newData: await ctx.db.get(assignmentId),
      recordId: String(assignmentId),
      tableName: "onboarding_assignments",
    });
    return { id: assignmentId };
  },
});

export const completeAssignmentTask = mutation({
  args: {
    assignmentId: v.id("onboardingAssignments"),
    taskId: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireAnyRole(ctx, ["employee", "manager", "hr_admin"]);
    const current = await ctx.db.get(args.assignmentId);
    if (!current) {
      throw new Error("Assignment not found");
    }

    const canEdit =
      roles.includes("hr_admin") ||
      current.assigneeUserId === identity.subject ||
      current.managerUserId === identity.subject;

    if (!canEdit) {
      throw new Error("Forbidden");
    }

    const tasks = current.tasks.map((task) =>
      task.id === args.taskId ? { ...task, completedAt: task.completedAt ?? now() } : task,
    );
    const status = tasks.every((task) => task.completedAt) ? "completed" : "in_progress";

    await ctx.db.patch(args.assignmentId, {
      status,
      tasks,
      updatedAt: now(),
    });
    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...current, status, tasks, updatedAt: now() },
      oldData: current,
      recordId: String(args.assignmentId),
      tableName: "onboarding_assignments",
    });
    return { ok: true };
  },
});
