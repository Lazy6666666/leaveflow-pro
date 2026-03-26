import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

import { now, recordAudit, requireAnyRole } from "./lib/auth";

async function requireTrainingAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireAnyRole(ctx, ["hr_admin"]);
}

export const getTrainingData = query({
  args: {},
  handler: async (ctx) => {
    await requireTrainingAdmin(ctx);
    const [courses, assignments, certifications, profiles] = await Promise.all([
      ctx.db.query("trainingCourses").collect(),
      ctx.db.query("trainingAssignments").collect(),
      ctx.db.query("certificationRecords").collect(),
      ctx.db.query("profiles").collect(),
    ]);
    const profileMap = new Map(profiles.map((profile) => [profile.userId, profile.fullName ?? profile.userId]));

    return {
      assignments: assignments.map((assignment) => ({
        courseId: assignment.courseId,
        employeeUserId: assignment.employeeUserId,
        employeeName: profileMap.get(assignment.employeeUserId) ?? assignment.employeeUserId,
        id: assignment._id,
        status: assignment.status,
      })),
      certifications: certifications.map((record) => ({
        employeeName: profileMap.get(record.employeeUserId) ?? record.employeeUserId,
        employeeUserId: record.employeeUserId,
        expiresOn: record.expiresOn,
        id: record._id,
        issuedOn: record.issuedOn,
        name: record.name,
      })),
      courses: courses.map((course) => ({
        description: course.description ?? "",
        id: course._id,
        name: course.name,
        required: course.required,
      })),
      profiles: profiles.map((profile) => ({
        fullName: profile.fullName ?? profile.userId,
        userId: profile.userId,
      })),
    };
  },
});

export const saveCourse = mutation({
  args: {
    courseId: v.optional(v.id("trainingCourses")),
    description: v.optional(v.string()),
    name: v.string(),
    required: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireTrainingAdmin(ctx);
    const payload = { description: args.description, name: args.name, required: args.required, updatedAt: now() };

    if (!args.courseId) {
      const courseId = await ctx.db.insert("trainingCourses", { ...payload, createdAt: now(), createdBy: identity.subject });
      await recordAudit(ctx, {
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(courseId),
        recordId: String(courseId),
        tableName: "training_courses",
      });
      return { id: courseId };
    }

    const current = await ctx.db.get(args.courseId);
    await ctx.db.patch(args.courseId, payload);
    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...current, ...payload },
      oldData: current,
      recordId: String(args.courseId),
      tableName: "training_courses",
    });
    return { id: args.courseId };
  },
});

export const assignCourse = mutation({
  args: {
    courseId: v.id("trainingCourses"),
    employeeUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireTrainingAdmin(ctx);
    const assignmentId = await ctx.db.insert("trainingAssignments", {
      courseId: args.courseId,
      createdAt: now(),
      createdBy: identity.subject,
      employeeUserId: args.employeeUserId,
      status: "assigned",
      updatedAt: now(),
    });
    await recordAudit(ctx, {
      action: "INSERT",
      changedBy: identity.subject,
      newData: await ctx.db.get(assignmentId),
      recordId: String(assignmentId),
      tableName: "training_assignments",
    });
    return { id: assignmentId };
  },
});

export const saveCertification = mutation({
  args: {
    certificationId: v.optional(v.id("certificationRecords")),
    employeeUserId: v.string(),
    expiresOn: v.string(),
    issuedOn: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireTrainingAdmin(ctx);
    const payload = {
      employeeUserId: args.employeeUserId,
      expiresOn: args.expiresOn,
      issuedOn: args.issuedOn,
      name: args.name,
      updatedAt: now(),
    };

    if (!args.certificationId) {
      const certificationId = await ctx.db.insert("certificationRecords", { ...payload, createdAt: now(), createdBy: identity.subject });
      await recordAudit(ctx, {
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(certificationId),
        recordId: String(certificationId),
        tableName: "certification_records",
      });
      return { id: certificationId };
    }

    const current = await ctx.db.get(args.certificationId);
    await ctx.db.patch(args.certificationId, payload);
    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...current, ...payload },
      oldData: current,
      recordId: String(args.certificationId),
      tableName: "certification_records",
    });
    return { id: args.certificationId };
  },
});
