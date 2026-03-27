import { v } from "convex/values";
import { action, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

import { now, recordAudit, requireAnyRole } from "./lib/auth";
import { getEnv } from "./lib/env";

const applicationStageValidator = v.union(
  v.literal("new"),
  v.literal("under_review"),
  v.literal("interview"),
  v.literal("offer"),
  v.literal("rejected"),
);

const listingStatusValidator = v.union(v.literal("draft"), v.literal("open"), v.literal("closed"));

const providerValidator = v.union(
  v.literal("greenhouse"),
  v.literal("linkedin"),
  v.literal("bayt"),
  v.literal("scraper"),
);

type ExternalListing = {
  description?: string;
  externalId: string;
  externalUrl?: string;
  location?: string;
  source: "greenhouse" | "linkedin" | "bayt" | "scraper";
  sourceLabel: string;
  title: string;
};

async function requireCareersAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireAnyRole(ctx, ["hr_admin"]);
}

function toIsoDate(value: string | undefined) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function defaultGreenhouseBoard() {
  return getEnv("CAREERS_GREENHOUSE_BOARD_TOKEN") ?? "openai";
}

async function fetchGreenhouseListings(boardToken: string): Promise<ExternalListing[]> {
  const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`);
  if (!response.ok) {
    throw new Error(`greenhouse_fetch_failed:${response.status}`);
  }

  const payload = (await response.json()) as {
    jobs?: Array<{
      absolute_url?: string;
      content?: string;
      id: number | string;
      location?: { name?: string };
      title?: string;
    }>;
  };

  return (payload.jobs ?? [])
    .filter((job) => Boolean(job.title))
    .map((job) => ({
      description: job.content ?? undefined,
      externalId: String(job.id),
      externalUrl: job.absolute_url ?? undefined,
      location: job.location?.name ?? undefined,
      source: "greenhouse",
      sourceLabel: `Greenhouse:${boardToken}`,
      title: job.title ?? "Untitled role",
    }));
}

async function fetchScraperListings(endpoint: string): Promise<ExternalListing[]> {
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`scraper_fetch_failed:${response.status}`);
  }

  const payload = (await response.json()) as { jobs?: ExternalListing[] };
  return (payload.jobs ?? []).map((job, index) => ({
    ...job,
    externalId: job.externalId || `scraper-${index}`,
    source: "scraper",
    sourceLabel: job.sourceLabel || "Scraper fallback",
    title: job.title || "Untitled role",
  }));
}

async function resolveExternalListings(provider: "greenhouse" | "linkedin" | "bayt" | "scraper"): Promise<{ items: ExternalListing[]; note?: string }> {
  switch (provider) {
    case "greenhouse":
      return { items: await fetchGreenhouseListings(defaultGreenhouseBoard()) };
    case "scraper": {
      const endpoint = getEnv("CAREERS_SCRAPER_ENDPOINT");
      if (!endpoint) {
        return { items: [], note: "Scraper fallback is switchable through CAREERS_SCRAPER_ENDPOINT." };
      }
      return { items: await fetchScraperListings(endpoint) };
    }
    case "linkedin":
      return { items: [], note: "LinkedIn Jobs API requires partner access; provider kept as a switchable adapter." };
    case "bayt":
      return { items: [], note: "Bayt integration requires provider credentials or a scraper endpoint; provider kept as a switchable adapter." };
  }
}

export const getCareersData = query({
  args: {},
  handler: async (ctx) => {
    await requireCareersAdmin(ctx);
    const [listings, applications, departments] = await Promise.all([
      ctx.db.query("jobListings").collect(),
      ctx.db.query("jobApplications").collect(),
      ctx.db.query("departments").collect(),
    ]);

    const departmentMap = new Map(departments.map((department) => [String(department._id), department.name]));
    const listingMap = new Map(listings.map((listing) => [String(listing._id), listing]));

    return {
      applications: applications
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map((application) => ({
          appliedAt: application.appliedAt,
          createdAt: new Date(application.createdAt).toISOString(),
          email: application.email ?? "",
          externalUrl: listingMap.get(String(application.listingId))?.externalUrl ?? null,
          fullName: application.fullName,
          id: application._id,
          listingId: application.listingId,
          positionTitle: application.positionTitle,
          source: application.source,
          stage: application.stage,
          updatedAt: new Date(application.updatedAt).toISOString(),
        })),
      listings: listings
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map((listing) => ({
          departmentId: listing.departmentId ?? null,
          departmentName: listing.departmentId ? departmentMap.get(String(listing.departmentId)) ?? null : null,
          description: listing.description ?? "",
          externalUrl: listing.externalUrl ?? null,
          id: listing._id,
          location: listing.location ?? "",
          source: listing.source,
          sourceLabel: listing.sourceLabel ?? listing.source,
          status: listing.status,
          title: listing.title,
          updatedAt: new Date(listing.updatedAt).toISOString(),
        })),
    };
  },
});

export const saveJobListing = mutation({
  args: {
    departmentId: v.optional(v.id("departments")),
    description: v.optional(v.string()),
    externalId: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    listingId: v.optional(v.id("jobListings")),
    location: v.optional(v.string()),
    source: v.optional(v.union(v.literal("manual"), providerValidator)),
    sourceLabel: v.optional(v.string()),
    status: listingStatusValidator,
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireCareersAdmin(ctx);
    const payload = {
      departmentId: args.departmentId,
      description: args.description,
      externalId: args.externalId,
      externalUrl: args.externalUrl,
      location: args.location,
      source: args.source ?? "manual",
      sourceLabel: args.sourceLabel,
      status: args.status,
      title: args.title,
      updatedAt: now(),
    };

    if (!args.listingId) {
      const listingId = await ctx.db.insert("jobListings", {
        ...payload,
        createdAt: now(),
        createdBy: identity.subject,
      });
      await recordAudit(ctx, {
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(listingId),
        recordId: String(listingId),
        tableName: "job_listings",
      });
      return { id: listingId };
    }

    const current = await ctx.db.get(args.listingId);
    await ctx.db.patch(args.listingId, payload);
    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...current, ...payload },
      oldData: current,
      recordId: String(args.listingId),
      tableName: "job_listings",
    });
    return { id: args.listingId };
  },
});

export const saveJobApplication = mutation({
  args: {
    applicationId: v.optional(v.id("jobApplications")),
    appliedAt: v.optional(v.string()),
    email: v.optional(v.string()),
    externalId: v.optional(v.string()),
    fullName: v.string(),
    listingId: v.id("jobListings"),
    notes: v.optional(v.string()),
    positionTitle: v.string(),
    source: v.optional(v.union(v.literal("manual"), providerValidator)),
    stage: applicationStageValidator,
  },
  handler: async (ctx, args) => {
    const { identity } = await requireCareersAdmin(ctx);
    const payload = {
      appliedAt: toIsoDate(args.appliedAt),
      email: args.email,
      externalId: args.externalId,
      fullName: args.fullName,
      listingId: args.listingId,
      notes: args.notes,
      positionTitle: args.positionTitle,
      source: args.source ?? "manual",
      stage: args.stage,
      stageUpdatedAt: now(),
      updatedAt: now(),
    };

    if (!args.applicationId) {
      const applicationId = await ctx.db.insert("jobApplications", {
        ...payload,
        createdAt: now(),
        createdBy: identity.subject,
      });
      await recordAudit(ctx, {
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(applicationId),
        recordId: String(applicationId),
        tableName: "applications",
      });
      return { id: applicationId };
    }

    const current = await ctx.db.get(args.applicationId);
    await ctx.db.patch(args.applicationId, payload);
    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...current, ...payload },
      oldData: current,
      recordId: String(args.applicationId),
      tableName: "applications",
    });
    return { id: args.applicationId };
  },
});

export const moveApplicationStage = mutation({
  args: {
    applicationId: v.id("jobApplications"),
    stage: applicationStageValidator,
  },
  handler: async (ctx, args) => {
    const { identity } = await requireCareersAdmin(ctx);
    const current = await ctx.db.get(args.applicationId);
    if (!current) {
      throw new Error("Application not found");
    }

    const payload = { stage: args.stage, stageUpdatedAt: now(), updatedAt: now() };
    await ctx.db.patch(args.applicationId, payload);
    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...current, ...payload },
      oldData: current,
      recordId: String(args.applicationId),
      tableName: "applications",
    });
    return { ok: true };
  },
});

export const syncExternalSource = action({
  args: {
    provider: providerValidator,
  },
  handler: async (ctx, args) => {
    const { items, note } = await resolveExternalListings(args.provider);
    let imported = 0;

    for (const item of items) {
      const existing = await ctx.runQuery(queryExistingListingByExternalKey, {
        externalId: item.externalId,
        source: item.source,
      });

      await ctx.runMutation(saveJobListingFromSync, {
        description: item.description,
        externalId: item.externalId,
        externalUrl: item.externalUrl,
        listingId: existing?.id,
        location: item.location,
        source: item.source,
        sourceLabel: item.sourceLabel,
        status: "open",
        title: item.title,
      });
      imported += 1;
    }

    return {
      imported,
      note: note ?? `Imported ${imported} external listing${imported === 1 ? "" : "s"} from ${args.provider}.`,
      provider: args.provider,
    };
  },
});

const queryExistingListingByExternalKey = query({
  args: {
    externalId: v.string(),
    source: v.union(v.literal("greenhouse"), v.literal("linkedin"), v.literal("bayt"), v.literal("scraper")),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db
      .query("jobListings")
      .withIndex("by_source_externalId", (q) => q.eq("source", args.source).eq("externalId", args.externalId))
      .unique();

    return listing ? { id: listing._id } : null;
  },
});

const saveJobListingFromSync = mutation({
  args: {
    description: v.optional(v.string()),
    externalId: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    listingId: v.optional(v.id("jobListings")),
    location: v.optional(v.string()),
    source: v.union(v.literal("greenhouse"), v.literal("linkedin"), v.literal("bayt"), v.literal("scraper")),
    sourceLabel: v.optional(v.string()),
    status: listingStatusValidator,
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const payload = {
      description: args.description,
      externalId: args.externalId,
      externalUrl: args.externalUrl,
      lastSyncedAt: now(),
      location: args.location,
      source: args.source,
      sourceLabel: args.sourceLabel,
      status: args.status,
      title: args.title,
      updatedAt: now(),
    };

    if (!args.listingId) {
      return await ctx.db.insert("jobListings", {
        ...payload,
        createdAt: now(),
        createdBy: `sync:${args.source}`,
      });
    }

    await ctx.db.patch(args.listingId, payload);
    return args.listingId;
  },
});
