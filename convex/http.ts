import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { verifyWebhook } from "@clerk/backend/webhooks";

const http = httpRouter();

type HttpPayload = Record<string, unknown>;

function isRecord(value: unknown): value is HttpPayload {
  return typeof value === "object" && value !== null;
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function getBearerSecret(authorization: string | null) {
  return authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : undefined;
}

function extractEmailAddress(payload: HttpPayload) {
  const directEmail = getOptionalString(payload.email) ?? getOptionalString(payload.email_address);
  if (directEmail) {
    return directEmail;
  }

  const primaryEmail = isRecord(payload.primary_email_address)
    ? getOptionalString(payload.primary_email_address.email_address) ??
      getOptionalString(payload.primary_email_address.emailAddress)
    : undefined;
  if (primaryEmail) {
    return primaryEmail;
  }

  const primaryEmailId = getOptionalString(payload.primary_email_address_id) ??
    getOptionalString(payload.primaryEmailAddressId);
  const emailAddresses = Array.isArray(payload.email_addresses)
    ? payload.email_addresses
    : Array.isArray(payload.emailAddresses)
      ? payload.emailAddresses
      : [];

  for (const emailAddress of emailAddresses) {
    if (!isRecord(emailAddress)) {
      continue;
    }

    const email = getOptionalString(emailAddress.email_address) ?? getOptionalString(emailAddress.emailAddress);
    const id = getOptionalString(emailAddress.id);
    if (email && (!primaryEmailId || id === primaryEmailId)) {
      return email;
    }
  }

  return undefined;
}

function normalizeClerkProvisioningPayload(payload: unknown) {
  if (!isRecord(payload)) {
    return { error: "Request body must be a JSON object." } as const;
  }

  const eventType = getOptionalString(payload.type);
  if (eventType && !["user.created", "user.updated"].includes(eventType)) {
    return { ignored: true, eventType } as const;
  }

  const data = isRecord(payload.data) ? payload.data : payload;
  const userId = getOptionalString(data.id) ?? getOptionalString(data.userId) ?? getOptionalString(data.user_id);
  if (!userId) {
    return { error: "Request body did not include a Clerk user id." } as const;
  }

  const combinedName = [getOptionalString(data.first_name), getOptionalString(data.last_name)]
    .filter(Boolean)
    .join(" ")
    .trim();
  const fullName = (getOptionalString(data.full_name) ?? combinedName) || undefined;

  return {
    userId,
    fullName,
    email: extractEmailAddress(data),
    imageUrl: getOptionalString(data.image_url) ??
      getOptionalString(data.profile_image_url) ??
      getOptionalString(data.imageUrl),
  } as const;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

http.route({
  path: "/biometrics/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    let payload: unknown = null;

    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      payload = { raw_body: rawBody };
    }

    const url = new URL(request.url);
    const authorization = request.headers.get("authorization");
    const bearerSecret = getBearerSecret(authorization);
    const secret = request.headers.get("x-webhook-secret") ??
      request.headers.get("x-biometrics-secret") ??
      bearerSecret ??
      (typeof payload === "object" && payload && "webhook_secret" in payload && typeof payload.webhook_secret === "string"
        ? payload.webhook_secret
        : undefined);
    const vendor = url.searchParams.get("vendor") ??
      (typeof payload === "object" && payload && "vendor" in payload && typeof payload.vendor === "string"
        ? payload.vendor
        : undefined) ??
      "generic_webhook";

    const result = await ctx.runAction(internal.admin.ingestBiometricsWebhook, {
      payload,
      vendor,
      webhookSecret: secret,
    });

    return jsonResponse(result, result.status ?? (result.success ? 202 : 400));
  }),
});

http.route({
  path: "/clerk/onboarding",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const event = await verifyWebhook(request);
      const normalized = normalizeClerkProvisioningPayload({
        type: event.type,
        data: event.data,
      });

      if ("ignored" in normalized) {
        return jsonResponse(
          {
            success: true,
            ignored: true,
            eventType: normalized.eventType,
          },
          202,
        );
      }
      if ("error" in normalized) {
        return jsonResponse(
          {
            success: false,
            message: normalized.error,
          },
          400,
        );
      }

      const result = await ctx.runMutation(internal.users.provisionUserFromServer, normalized);
      return jsonResponse(
        {
          success: true,
          ...result,
        },
        result.createdProfile ? 201 : 200,
      );
    } catch (error) {
      return jsonResponse(
        {
          success: false,
          message: error instanceof Error ? error.message : "Unable to verify Clerk webhook.",
        },
        400,
      );
    }
  }),
});

export default http;
