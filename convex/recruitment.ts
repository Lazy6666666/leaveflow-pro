import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

import { now, recordAudit, requireAnyRole } from "./lib/auth";

const candidateStageValidator = v.union(
  v.literal("applied"),
  v.literal("screening"),
  v.literal("interview"),
  v.literal("offer"),
  v.literal("hired"),
  v.literal("rejected"),
);

const jobStatusValidator = v.union(v.literal("draft"), v.literal("open"), v.literal("closed"));

async function requireRecruitmentAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireAnyRole(ctx, ["hr_admin"]);
}

export const getRecruitmentData = query({
  args: {},
  handler: async (ctx) => {
    await requireRecruitmentAdmin(ctx);
    const [jobs, candidates, departments] = await Promise.all([
      ctx.db.query("recruitmentJobs").collect(),
      ctx.db.query("recruitmentCandidates").collect(),
      ctx.db.query("departments").collect(),
    ]);

    const departmentMap = new Map(departments.map((department) => [String(department._id), department.name]));

    return {
      candidates: candidates
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map((candidate) => ({
          createdAt: new Date(candidate.createdAt).toISOString(),
          email: candidate.email,
          fullName: candidate.fullName,
          id: candidate._id,
          jobId: candidate.jobId,
          notes: candidate.notes ?? "",
          stage: candidate.stage,
          updatedAt: new Date(candidate.updatedAt).toISOString(),
        })),
      jobs: jobs
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map((job) => ({
          departmentId: job.departmentId ?? null,
          departmentName: job.departmentId ? departmentMap.get(String(job.departmentId)) ?? null : null,
          description: job.description ?? "",
          id: job._id,
          location: job.location ?? "",
          status: job.status,
          title: job.title,
          updatedAt: new Date(job.updatedAt).toISOString(),
        })),
    };
  },
});

export const saveJob = mutation({
  args: {
    departmentId: v.optional(v.id("departments")),
    description: v.optional(v.string()),
    jobId: v.optional(v.id("recruitmentJobs")),
    location: v.optional(v.string()),
    status: jobStatusValidator,
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireRecruitmentAdmin(ctx);
    const payload = {
      departmentId: args.departmentId,
      description: args.description,
      location: args.location,
      status: args.status,
      title: args.title,
      updatedAt: now(),
    };

    if (!args.jobId) {
      const jobId = await ctx.db.insert("recruitmentJobs", {
        ...payload,
        createdAt: now(),
        createdBy: identity.subject,
      });
      await recordAudit(ctx, {
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(jobId),
        recordId: String(jobId),
        tableName: "recruitment_jobs",
      });
      return { id: jobId };
    }

    const current = await ctx.db.get(args.jobId);
    await ctx.db.patch(args.jobId, payload);
    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...current, ...payload },
      oldData: current,
      recordId: String(args.jobId),
      tableName: "recruitment_jobs",
    });
    return { id: args.jobId };
  },
});

export const saveCandidate = mutation({
  args: {
    candidateId: v.optional(v.id("recruitmentCandidates")),
    email: v.string(),
    fullName: v.string(),
    jobId: v.id("recruitmentJobs"),
    notes: v.optional(v.string()),
    stage: candidateStageValidator,
  },
  handler: async (ctx, args) => {
    const { identity } = await requireRecruitmentAdmin(ctx);
    const payload = {
      email: args.email,
      fullName: args.fullName,
      jobId: args.jobId,
      notes: args.notes,
      stage: args.stage,
      updatedAt: now(),
    };

    if (!args.candidateId) {
      const candidateId = await ctx.db.insert("recruitmentCandidates", {
        ...payload,
        createdAt: now(),
        createdBy: identity.subject,
      });
      await recordAudit(ctx, {
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(candidateId),
        recordId: String(candidateId),
        tableName: "recruitment_candidates",
      });
      return { id: candidateId };
    }

    const current = await ctx.db.get(args.candidateId);
    await ctx.db.patch(args.candidateId, payload);
    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...current, ...payload },
      oldData: current,
      recordId: String(args.candidateId),
      tableName: "recruitment_candidates",
    });
    return { id: args.candidateId };
  },
});

export const moveCandidateStage = mutation({
  args: {
    candidateId: v.id("recruitmentCandidates"),
    stage: candidateStageValidator,
  },
  handler: async (ctx, args) => {
    const { identity } = await requireRecruitmentAdmin(ctx);
    const current = await ctx.db.get(args.candidateId);
    if (!current) {
      throw new Error("Candidate not found");
    }

    const payload = { stage: args.stage, updatedAt: now() };
    await ctx.db.patch(args.candidateId, payload);
    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...current, ...payload },
      oldData: current,
      recordId: String(args.candidateId),
      tableName: "recruitment_candidates",
    });
    return { ok: true };
  },
});
