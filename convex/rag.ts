import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { getMistralApiKey } from "./lib/env";
import { now } from "./lib/auth";
import { getUserRoles, requireIdentity } from "./lib/auth";

const MISTRAL_EMBEDDING_MODEL = "mistral-embed";
const MISTRAL_DIMENSIONS = 1024;
const POLICY_VECTOR_SCORE_THRESHOLD = 0.55;
const MISTRAL_TIMEOUT_MS = 15_000;

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function buildSnippet(content: string, query: string) {
  const normalizedContent = content.toLowerCase();
  const normalizedQuery = normalizeQuery(query);
  const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  const matchIndex = searchTerms
    .map((term) => normalizedContent.indexOf(term))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0] ?? 0;

  const start = Math.max(matchIndex - 100, 0);
  const end = Math.min(matchIndex + 220, content.length);
  const snippet = content.slice(start, end).trim();
  return `${start > 0 ? "..." : ""}${snippet}${end < content.length ? "..." : ""}`;
}

async function embedText(input: string) {
  const apiKey = getMistralApiKey();
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MISTRAL_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch("https://api.mistral.ai/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: MISTRAL_EMBEDDING_MODEL,
        input: [input],
        output_dimension: MISTRAL_DIMENSIONS,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    console.error("Policy embedding transport failed", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    console.error("Policy embedding request failed", await response.text());
    return null;
  }

  let payload: any;
  try {
    payload = await response.json();
  } catch (error) {
    console.error("Policy embedding response parsing failed", error);
    return null;
  }
  const embedding = payload?.data?.[0]?.embedding;
  return Array.isArray(embedding) ? embedding : null;
}

async function requirePolicyReader(ctx: Parameters<typeof query>[0]["handler"] extends never ? never : any) {
  const identity = await requireIdentity(ctx);
  const roles = await getUserRoles(ctx, identity.subject);
  return { identity, roles, isHrAdmin: roles.includes("hr_admin") };
}

export const listPolicyDocuments = query({
  args: {},
  handler: async (ctx) => {
    const { isHrAdmin } = await requirePolicyReader(ctx);
    if (!isHrAdmin) {
      throw new Error("Forbidden");
    }
    const documents = await ctx.db.query("policyDocuments").withIndex("by_title").collect();
    return documents.map((document) => ({
      id: document._id,
      title: document.title,
      storageId: document.storageId ?? null,
      metadata: document.metadata ?? null,
      updatedAt: document.updatedAt,
    }));
  },
});

export const getPolicyDocumentsByIds = query({
  args: {
    ids: v.array(v.id("policyDocuments")),
  },
  handler: async (ctx, args) => {
    const { isHrAdmin } = await requirePolicyReader(ctx);
    if (!isHrAdmin) {
      throw new Error("Forbidden");
    }
    return await Promise.all(
      args.ids.map(async (id) => {
        const document = await ctx.db.get(id);
        return document
          ? {
              id: document._id,
              title: document.title,
              content: document.content,
              metadata: document.metadata ?? null,
              storageId: document.storageId ?? null,
            }
          : null;
      }),
    );
  },
});

export const searchPolicyLexical = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePolicyReader(ctx);
    const normalizedTerms = normalizeQuery(args.query).split(/\s+/).filter(Boolean);
    const documents = await ctx.db.query("policyDocuments").collect();
    return documents
      .map((document) => {
        const haystack = `${document.title}\n${document.content}`.toLowerCase();
        const score = normalizedTerms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
        return score > 0
          ? {
              id: document._id,
              title: document.title,
              score,
              snippet: buildSnippet(document.content, args.query),
              metadata: document.metadata ?? null,
            }
          : null;
      })
      .filter((document): document is NonNullable<typeof document> => !!document)
      .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
      .slice(0, 5);
  },
});

export const savePolicyDocument = mutation({
  args: {
    documentId: v.optional(v.id("policyDocuments")),
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
    metadata: v.optional(v.any()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(api.users.current, {});
    if (!currentUser || !currentUser.roles.includes("hr_admin")) {
      throw new Error("Forbidden");
    }

    const payload = {
      title: args.title,
      content: args.content,
      embedding: args.embedding,
      metadata: args.metadata,
      storageId: args.storageId,
      updatedAt: now(),
    };

    if (args.documentId) {
      await ctx.db.patch(args.documentId, payload);
      return { id: args.documentId };
    }

    const id = await ctx.db.insert("policyDocuments", {
      ...payload,
      createdAt: now(),
    });
    return { id };
  },
});

export const indexPolicyDocument = action({
  args: {
    documentId: v.optional(v.id("policyDocuments")),
    title: v.string(),
    content: v.string(),
    metadata: v.optional(v.any()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(api.users.current, {});
    if (!currentUser || !currentUser.roles.includes("hr_admin")) {
      throw new Error("Forbidden");
    }

    const embedding = await embedText(`${args.title}\n\n${args.content}`);
    if (!embedding) {
      throw new Error("Unable to generate policy embeddings");
    }

    return await ctx.runMutation(api.rag.savePolicyDocument, {
      documentId: args.documentId,
      title: args.title,
      content: args.content,
      embedding,
      metadata: args.metadata,
      storageId: args.storageId,
    });
  },
});

export const searchPolicy = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(api.users.current, {});
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    const embedding = await embedText(args.query);
    if (!embedding) {
      const lexicalMatches = await ctx.runQuery(api.rag.searchPolicyLexical, { query: args.query });
      return {
        source: "lexical",
        matches: lexicalMatches,
      };
    }

    const nearest = await ctx.vectorSearch("policyDocuments", "by_embedding", {
      vector: embedding,
      limit: 5,
    });

    const documents = await ctx.runQuery(api.rag.getPolicyDocumentsByIds, {
      ids: nearest.map((result) => result._id),
    });

    const matches = nearest
      .filter((result) => result._score >= POLICY_VECTOR_SCORE_THRESHOLD)
      .map((result) => {
        const document = documents.find((entry) => entry?.id === result._id);
        return document
          ? {
              id: document.id,
              title: document.title,
              score: Number(result._score.toFixed(4)),
              snippet: buildSnippet(document.content, args.query),
              metadata: document.metadata,
            }
          : null;
      })
      .filter((document): document is NonNullable<typeof document> => !!document);

    if (matches.length === 0) {
      const lexicalMatches = await ctx.runQuery(api.rag.searchPolicyLexical, { query: args.query });
      return {
        source: lexicalMatches.length > 0 ? "lexical" : "vector",
        matches: lexicalMatches,
      };
    }

    return {
      source: "vector",
      matches,
    };
  },
});
