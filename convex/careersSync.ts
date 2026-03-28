import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { now } from "./lib/auth";
import type { AppRole } from "./constants";

// ─── Internal helpers ─────────────────────────────────────────────────────────

export const getListingBySourceId = internalQuery({
  args: { source: v.string(), externalId: v.string() },
  handler: async (ctx, args) =>
    ctx.db
      .query("jobListings")
      .withIndex("by_source_externalId", (q) =>
        q.eq("source", args.source as "linkedin" | "bayt" | "scraper").eq("externalId", args.externalId),
      )
      .unique(),
});

export const insertListing = internalMutation({
  args: {
    title: v.string(),
    source: v.union(v.literal("linkedin"), v.literal("bayt"), v.literal("scraper"), v.literal("manual"), v.literal("greenhouse")),
    externalId: v.string(),
    externalUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    sourceLabel: v.optional(v.string()),
    createdBy: v.string(),
    nowMs: v.number(),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("jobListings", {
      title: args.title,
      source: args.source,
      externalId: args.externalId,
      externalUrl: args.externalUrl,
      location: args.location,
      description: args.description,
      sourceLabel: args.sourceLabel,
      status: "open",
      createdBy: args.createdBy,
      createdAt: args.nowMs,
      updatedAt: args.nowMs,
      lastSyncedAt: args.nowMs,
    }),
});

export const patchListing = internalMutation({
  args: {
    id: v.id("jobListings"),
    title: v.string(),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    nowMs: v.number(),
  },
  handler: async (ctx, args) =>
    ctx.db.patch(args.id, {
      title: args.title,
      location: args.location,
      description: args.description,
      externalUrl: args.externalUrl,
      updatedAt: args.nowMs,
      lastSyncedAt: args.nowMs,
    }),
});

// ─── Adapters ─────────────────────────────────────────────────────────────────

interface RawListing {
  externalId: string;
  title: string;
  location?: string;
  description?: string;
  externalUrl?: string;
  sourceLabel?: string;
}

async function requireActionRoles(
  ctx: Parameters<typeof syncExternalJobs.handler>[0],
  allowedRoles: AppRole[],
) {
  const currentUser = await ctx.runQuery(api.users.current as never, {});
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const roles = (currentUser as { roles: AppRole[] }).roles;
  const hasAllowedRole =
    allowedRoles.some((role) => roles.includes(role)) ||
    roles.includes("convex_dev") ||
    roles.includes("dev");

  if (!hasAllowedRole) {
    throw new Error("Forbidden");
  }

  return { identity: { subject: (currentUser as { userId: string }).userId }, roles };
}

async function fetchLinkedIn(keywords: string, location: string): Promise<RawListing[]> {
  try {
    const res = await fetch(
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&f_TPR=r86400`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; LeaveFlowBot/1.0)" }, signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return [];
    const html = await res.text();
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!match) return [];
    const data = JSON.parse(match[1]) as Array<{ title?: string; url?: string; identifier?: { value?: string }; jobLocation?: { address?: { addressLocality?: string } } }>;
    if (!Array.isArray(data)) return [];
    return data.slice(0, 20).map((item, i) => ({
      externalId: item.identifier?.value ?? `linkedin-${i}-${Date.now()}`,
      title: item.title ?? "Untitled",
      location: item.jobLocation?.address?.addressLocality,
      externalUrl: item.url,
      sourceLabel: "LinkedIn",
    }));
  } catch {
    return [];
  }
}

async function fetchBayt(keywords: string): Promise<RawListing[]> {
  try {
    const res = await fetch(
      `https://www.bayt.com/en/international/jobs/?q=${encodeURIComponent(keywords)}`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; LeaveFlowBot/1.0)" }, signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return [];
    const html = await res.text();
    const matches = [...html.matchAll(/data-job-id="(\d+)"[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/g)];
    return matches.slice(0, 20).map(([, id, rawTitle]) => ({
      externalId: `bayt-${id}`,
      title: rawTitle.replace(/<[^>]+>/g, "").trim() || "Untitled",
      externalUrl: `https://www.bayt.com/en/job/${id}/`,
      sourceLabel: "Bayt",
    }));
  } catch {
    return [];
  }
}

// ─── Public action ────────────────────────────────────────────────────────────

export const syncExternalJobs = action({
  args: {
    source: v.union(v.literal("linkedin"), v.literal("bayt"), v.literal("scraper")),
    keywords: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ inserted: number; updated: number; errors: string[] }> => {
    const { identity } = await requireActionRoles(ctx, ["hr_admin"]);
    const keywords = args.keywords ?? "HR Manager";
    const location = args.location ?? "Dubai";
    const errors: string[] = [];
    let rawListings: RawListing[] = [];

    if (args.source === "linkedin") {
      rawListings = await fetchLinkedIn(keywords, location);
      if (!rawListings.length) errors.push("LinkedIn: no listings returned — may need scraper fallback");
    } else if (args.source === "bayt") {
      rawListings = await fetchBayt(keywords);
      if (!rawListings.length) errors.push("Bayt: no listings returned");
    } else {
      // Scraper boundary: invoke scripts/scrape_jobs.mjs externally
      return { inserted: 0, updated: 0, errors: ["scraper: run scripts/scrape_jobs.mjs and POST to /api/careers/ingest"] };
    }

    let inserted = 0;
    let updated = 0;
    const nowMs = now();

    for (const listing of rawListings) {
      try {
        const existing = await ctx.runQuery(internal.careersSync.getListingBySourceId, {
          source: args.source,
          externalId: listing.externalId,
        });
        if (existing) {
          await ctx.runMutation(internal.careersSync.patchListing, {
            id: existing._id,
            title: listing.title,
            location: listing.location,
            description: listing.description,
            externalUrl: listing.externalUrl,
            nowMs,
          });
          updated++;
        } else {
          await ctx.runMutation(internal.careersSync.insertListing, {
            title: listing.title,
            source: args.source,
            externalId: listing.externalId,
            externalUrl: listing.externalUrl,
            location: listing.location,
            description: listing.description,
            sourceLabel: listing.sourceLabel,
            createdBy: identity.subject,
            nowMs,
          });
          inserted++;
        }
      } catch (err) {
        errors.push(`${listing.externalId}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return { inserted, updated, errors };
  },
});
