"use node";

import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getConvexSiteUrl, getResendApiKey, getResendFromEmail } from "./lib/env";
import { escapeBalanceEmailHtml, renderBalanceEmail } from "./lib/emailTemplates";
import { matchNotificationThreshold, notificationDateKey, normalizeThresholds, resolveDaysRemaining, resolveDocumentStatus } from "./documentExpiryHelpers";
import { now, recordAudit, requireAnyRole } from "./lib/auth";
import { internal } from "./_generated/api";

export const listDocumentExpiryRecords = query({
  args: {},
  handler: async (ctx) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    const documents = await ctx.db.query("documents").withIndex("by_expiryDate").collect();
    const today = new Date();

    return documents.map((document) => {
      const daysRemaining = resolveDaysRemaining(document.expiryDate, today);
      return {
        category: document.category,
        daysRemaining,
        expiryDate: document.expiryDate,
        hrRecipients: document.hrRecipients ?? [],
        id: document._id,
        linkPath: document.linkPath ?? "/admin/document-expiry",
        name: document.name,
        notifyDaysBefore: normalizeThresholds(document.notifyDaysBefore),
        ownerName: document.ownerName,
        ownerType: document.ownerType,
        status: resolveDocumentStatus(daysRemaining),
        updatedAt: new Date(document.updatedAt).toISOString(),
      };
    });
  },
});

export const saveDocument = mutation({
  args: {
    category: v.union(v.literal("corporate"), v.literal("employee")),
    documentId: v.optional(v.id("documents")),
    expiryDate: v.string(),
    hrRecipients: v.optional(v.array(v.string())),
    linkPath: v.optional(v.string()),
    name: v.string(),
    notifyDaysBefore: v.optional(v.array(v.number())),
    ownerName: v.string(),
    ownerType: v.union(v.literal("company"), v.literal("employee")),
    ownerUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAnyRole(ctx, ["hr_admin"]);
    const payload = {
      category: args.category,
      expiryDate: args.expiryDate,
      hrRecipients: args.hrRecipients,
      linkPath: args.linkPath,
      name: args.name,
      notifyDaysBefore: normalizeThresholds(args.notifyDaysBefore),
      ownerName: args.ownerName,
      ownerType: args.ownerType,
      ownerUserId: args.ownerUserId,
      updatedAt: now(),
    };

    if (!args.documentId) {
      const documentId = await ctx.db.insert("documents", {
        ...payload,
        createdAt: now(),
        createdBy: identity.subject,
      });
      await recordAudit(ctx, {
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(documentId),
        recordId: String(documentId),
        tableName: "documents",
      });
      return { id: documentId };
    }

    const current = await ctx.db.get(args.documentId);
    await ctx.db.patch(args.documentId, payload);
    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...current, ...payload },
      oldData: current,
      recordId: String(args.documentId),
      tableName: "documents",
    });
    return { id: args.documentId };
  },
});

const getDocumentExpiryNotificationCandidates = internalQuery({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").withIndex("by_expiryDate").collect();
    const roleRows = await ctx.db.query("userRoles").withIndex("by_role", (q) => q.eq("role", "hr_admin")).collect();
    const profileRows = await ctx.db.query("profiles").collect();
    const profileMap = new Map(profileRows.map((profile) => [profile.userId, profile]));
    const defaultRecipients = roleRows
      .map((role) => profileMap.get(role.userId)?.email ?? null)
      .filter((email): email is string => Boolean(email));

    return { defaultRecipients, documents };
  },
});

const getExistingNotificationRecord = internalQuery({
  args: {
    documentId: v.id("documents"),
    notificationDate: v.string(),
    threshold: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documentExpiryNotifications")
      .withIndex("by_document_threshold_date", (q) =>
        q.eq("documentId", args.documentId).eq("threshold", args.threshold).eq("notificationDate", args.notificationDate),
      )
      .unique();
  },
});

const insertNotificationRecord = internalMutation({
  args: {
    daysRemaining: v.number(),
    documentId: v.id("documents"),
    error: v.optional(v.string()),
    notificationDate: v.string(),
    recipients: v.array(v.string()),
    resendId: v.optional(v.string()),
    status: v.union(v.literal("sent"), v.literal("skipped"), v.literal("failed")),
    threshold: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documentExpiryNotifications", {
      createdAt: now(),
      daysRemaining: args.daysRemaining,
      documentId: args.documentId,
      error: args.error,
      notificationDate: args.notificationDate,
      recipients: args.recipients,
      resendId: args.resendId,
      status: args.status,
      threshold: args.threshold,
    });
  },
});

function buildDocumentExpiryEmailHtml(input: {
  daysRemaining: number;
  documentName: string;
  expiryDate: string;
  link: string;
  ownerName: string;
}) {
  const urgencyLabel = input.daysRemaining <= 0 ? "already expired" : `${input.daysRemaining} day${input.daysRemaining === 1 ? "" : "s"} remaining`;
  return renderBalanceEmail({
    title: input.daysRemaining <= 0 ? "Document expiry alert" : "Document expiry reminder",
    preheader: `${input.documentName} for ${input.ownerName} is ${urgencyLabel}.`,
    bodyHtml: [
      `<p style="margin:0 0 12px;">A tracked document requires action:</p>`,
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:12px 0 0;">`,
      `<tbody>`,
      `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;"><strong>Document</strong></td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${escapeBalanceEmailHtml(input.documentName)}</td></tr>`,
      `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;"><strong>Owner</strong></td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${escapeBalanceEmailHtml(input.ownerName)}</td></tr>`,
      `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;"><strong>Expiry date</strong></td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${escapeBalanceEmailHtml(input.expiryDate)}</td></tr>`,
      `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;"><strong>Days remaining</strong></td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${input.daysRemaining <= 0 ? "Already expired" : input.daysRemaining}</td></tr>`,
      `</tbody>`,
      `</table>`,
      `<p style="margin:12px 0 0;">Open the document expiry workspace to review next actions.</p>`,
    ].join(""),
    cta: {
      href: input.link,
      label: "Open Document Expiry",
    },
    footerNote: "This alert is generated by the BALANCE document expiry cron.",
  });
}

export const checkDocumentExpiry = internalAction({
  args: {},
  handler: async (ctx) => {
    const { defaultRecipients, documents } = await ctx.runQuery(getDocumentExpiryNotificationCandidates, {});
    const resendApiKey = getResendApiKey();
    const resendFromEmail = getResendFromEmail();
    const siteUrl = getConvexSiteUrl() ?? "";
    const notificationDate = notificationDateKey(new Date());
    let duplicates = 0;
    let evaluated = 0;
    let failures = 0;
    let sent = 0;
    let skipped = 0;

    for (const document of documents) {
      const daysRemaining = resolveDaysRemaining(document.expiryDate, new Date());
      const threshold = matchNotificationThreshold(daysRemaining, document.notifyDaysBefore);
      if (threshold === null) {
        continue;
      }

      evaluated += 1;
      const existing = await ctx.runQuery(getExistingNotificationRecord, {
        documentId: document._id,
        notificationDate,
        threshold,
      });
      if (existing) {
        duplicates += 1;
        continue;
      }

      const recipients = (document.hrRecipients && document.hrRecipients.length > 0 ? document.hrRecipients : defaultRecipients)
        .map((entry) => entry.trim())
        .filter(Boolean);
      if (recipients.length === 0) {
        await ctx.runMutation(insertNotificationRecord, {
          daysRemaining,
          documentId: document._id,
          notificationDate,
          recipients: [],
          status: "skipped",
          threshold,
        });
        skipped += 1;
        continue;
      }

      const link = `${siteUrl}${document.linkPath ?? "/admin/document-expiry"}`;
      if (!resendApiKey || !resendFromEmail) {
        await ctx.runMutation(insertNotificationRecord, {
          daysRemaining,
          documentId: document._id,
          error: !resendApiKey ? "missing_resend_api_key" : "missing_resend_from_email",
          notificationDate,
          recipients,
          status: "skipped",
          threshold,
        });
        skipped += 1;
        continue;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFromEmail,
          html: buildDocumentExpiryEmailHtml({
            daysRemaining,
            documentName: document.name,
            expiryDate: document.expiryDate,
            link,
            ownerName: document.ownerName,
          }),
          subject: `[BALANCE] ${document.name} ${daysRemaining <= 0 ? "already expired" : `expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`}`,
          to: recipients,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        await ctx.runMutation(insertNotificationRecord, {
          daysRemaining,
          documentId: document._id,
          error: responseText,
          notificationDate,
          recipients,
          status: "failed",
          threshold,
        });
        await ctx.runMutation(internal.backendIncidents.recordIssue, {
          details: {
            documentId: String(document._id),
            notificationDate,
            responseText,
            status: response.status,
            threshold,
          },
          fingerprint: ["email", "document_expiry", String(document._id), String(threshold)],
          message: "Failed to send document expiry notification.",
          severity: "error",
          source: "email.document_expiry",
        });
        failures += 1;
        continue;
      }

      const payload = (await response.json().catch(() => null)) as { id?: string } | null;
      await ctx.runMutation(insertNotificationRecord, {
        daysRemaining,
        documentId: document._id,
        notificationDate,
        recipients,
        resendId: payload?.id,
        status: "sent",
        threshold,
      });
      sent += 1;
    }

    return {
      duplicates,
      evaluated,
      failures,
      sent,
      skipped,
    };
  },
});
