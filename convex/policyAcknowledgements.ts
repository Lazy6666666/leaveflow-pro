import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";

import {
  now,
  recordAudit,
  requireAnyRole,
  requireIdentity,
  toIso,
} from "./lib/auth";

type PolicyAcknowledgementStatus = "pending" | "acknowledged";

type PolicyAcknowledgementDoc = Doc<"policyAcknowledgements">;

function isOverdue(status: PolicyAcknowledgementStatus, dueDate?: string | null) {
  if (status !== "pending" || !dueDate) {
    return false;
  }

  const today = new Date().toISOString().slice(0, 10);
  return dueDate < today;
}

async function buildProfileMap(ctx: QueryCtx | MutationCtx) {
  const profiles = await ctx.db.query("profiles").collect();
  return new Map(
    profiles.map((profile) => [profile.userId, {
      email: profile.email ?? null,
      name: profile.fullName ?? profile.email ?? profile.userId,
    }]),
  );
}

async function buildRoleMap(ctx: QueryCtx | MutationCtx) {
  const roles = await ctx.db.query("userRoles").collect();
  return roles.reduce<Map<string, string[]>>((map, role) => {
    const existing = map.get(role.userId) ?? [];
    existing.push(role.role);
    map.set(role.userId, existing);
    return map;
  }, new Map());
}

function serializeAcknowledgement(
  acknowledgement: NonNullable<PolicyAcknowledgementDoc>,
  profileMap: Map<string, { email: string | null; name: string }>,
) {
  return {
    acknowledgedAt: toIso(acknowledgement.acknowledgedAt),
    assigneeName: profileMap.get(acknowledgement.assigneeUserId)?.name ?? acknowledgement.assigneeUserId,
    assigneeUserId: acknowledgement.assigneeUserId,
    assignedAt: toIso(acknowledgement.assignedAt),
    assignedByName: profileMap.get(acknowledgement.assignedByUserId)?.name ?? acknowledgement.assignedByUserId,
    assignedByUserId: acknowledgement.assignedByUserId,
    dueDate: acknowledgement.dueDate ?? null,
    id: acknowledgement._id,
    isOverdue: isOverdue(acknowledgement.status, acknowledgement.dueDate),
    note: acknowledgement.note ?? "",
    policyDocumentId: acknowledgement.policyDocumentId,
    policyTitle: acknowledgement.policyTitle,
    status: acknowledgement.status,
    updatedAt: toIso(acknowledgement.updatedAt),
  };
}

export const getPolicyAcknowledgementAdminOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAnyRole(ctx, ["hr_admin"]);

    const [acknowledgements, documents, profileMap, roleMap] = await Promise.all([
      ctx.db.query("policyAcknowledgements").collect(),
      ctx.db.query("policyDocuments").collect(),
      buildProfileMap(ctx),
      buildRoleMap(ctx),
    ]);

    const assignments = acknowledgements
      .sort((left, right) => right.assignedAt - left.assignedAt)
      .map((acknowledgement) => serializeAcknowledgement(acknowledgement, profileMap));

    const assignableEmployees = Array.from(profileMap.entries())
      .map(([userId, profile]) => ({
        email: profile.email,
        name: profile.name,
        roles: roleMap.get(userId) ?? [],
        userId,
      }))
      .filter((profile) => profile.roles.some((role) => role === "employee" || role === "manager"))
      .sort((left, right) => left.name.localeCompare(right.name));

    return {
      assignments,
      documents: documents
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map((document) => ({
          id: document._id,
          title: document.title,
          updatedAt: toIso(document.updatedAt),
        })),
      employees: assignableEmployees,
      summary: {
        acknowledged: assignments.filter((assignment) => assignment.status === "acknowledged").length,
        overdue: assignments.filter((assignment) => assignment.isOverdue).length,
        pending: assignments.filter((assignment) => assignment.status === "pending").length,
      },
    };
  },
});

export const assignPolicyAcknowledgement = mutation({
  args: {
    assigneeUserId: v.string(),
    dueDate: v.optional(v.string()),
    note: v.optional(v.string()),
    policyDocumentId: v.id("policyDocuments"),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAnyRole(ctx, ["hr_admin"]);
    const document = await ctx.db.get(args.policyDocumentId);

    if (!document) {
      throw new Error("Policy document not found");
    }

    const note = args.note?.trim();
    const dueDate = args.dueDate?.trim();
    const timestamp = now();
    const existing = await ctx.db
      .query("policyAcknowledgements")
      .withIndex("by_assigneeUserId_policyDocumentId", (q) =>
        q.eq("assigneeUserId", args.assigneeUserId).eq("policyDocumentId", args.policyDocumentId),
      )
      .unique();

    if (existing) {
      const oldData = existing;
      await ctx.db.patch(existing._id, {
        acknowledgedAt: undefined,
        assignedAt: timestamp,
        assignedByUserId: identity.subject,
        dueDate: dueDate || undefined,
        note: note || undefined,
        policyTitle: document.title,
        status: "pending",
        updatedAt: timestamp,
      });
      const newData = await ctx.db.get(existing._id);
      await recordAudit(ctx, {
        action: "UPDATE",
        changedBy: identity.subject,
        newData,
        oldData,
        recordId: String(existing._id),
        tableName: "policyAcknowledgements",
      });
      return { id: existing._id, reusedExisting: true };
    }

    const acknowledgementId = await ctx.db.insert("policyAcknowledgements", {
      acknowledgedAt: undefined,
      assigneeUserId: args.assigneeUserId,
      assignedAt: timestamp,
      assignedByUserId: identity.subject,
      dueDate: dueDate || undefined,
      note: note || undefined,
      policyDocumentId: args.policyDocumentId,
      policyTitle: document.title,
      status: "pending",
      updatedAt: timestamp,
    });

    await recordAudit(ctx, {
      action: "INSERT",
      changedBy: identity.subject,
      newData: await ctx.db.get(acknowledgementId),
      recordId: String(acknowledgementId),
      tableName: "policyAcknowledgements",
    });

    return { id: acknowledgementId, reusedExisting: false };
  },
});

export const getMyPolicyAcknowledgements = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const [acknowledgements, documents, profileMap] = await Promise.all([
      ctx.db
        .query("policyAcknowledgements")
        .withIndex("by_assigneeUserId", (q) => q.eq("assigneeUserId", identity.subject))
        .collect(),
      ctx.db.query("policyDocuments").collect(),
      buildProfileMap(ctx),
    ]);

    const documentMap = new Map(documents.map((document) => [String(document._id), document]));
    const assignments = acknowledgements
      .sort((left, right) => right.assignedAt - left.assignedAt)
      .map((acknowledgement) => {
        const document = documentMap.get(String(acknowledgement.policyDocumentId));
        return {
          ...serializeAcknowledgement(acknowledgement, profileMap),
          documentPreview: document ? document.content.slice(0, 220) : null,
          documentUpdatedAt: document ? toIso(document.updatedAt) : null,
        };
      });

    return {
      assignments,
      summary: {
        acknowledged: assignments.filter((assignment) => assignment.status === "acknowledged").length,
        overdue: assignments.filter((assignment) => assignment.isOverdue).length,
        pending: assignments.filter((assignment) => assignment.status === "pending").length,
      },
    };
  },
});

export const acknowledgePolicy = mutation({
  args: { acknowledgementId: v.id("policyAcknowledgements") },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const acknowledgement = await ctx.db.get(args.acknowledgementId);

    if (!acknowledgement) {
      throw new Error("Policy acknowledgement not found");
    }
    if (acknowledgement.assigneeUserId !== identity.subject) {
      throw new Error("Forbidden");
    }
    if (acknowledgement.status === "acknowledged") {
      return { id: acknowledgement._id, alreadyAcknowledged: true };
    }

    const timestamp = now();
    await ctx.db.patch(acknowledgement._id, {
      acknowledgedAt: timestamp,
      status: "acknowledged",
      updatedAt: timestamp,
    });

    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: await ctx.db.get(acknowledgement._id),
      oldData: acknowledgement,
      recordId: String(acknowledgement._id),
      tableName: "policyAcknowledgements",
    });

    return { id: acknowledgement._id, alreadyAcknowledged: false };
  },
});
