import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

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
    const bearerSecret = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : undefined;
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

    return new Response(JSON.stringify(result), {
      status: result.status ?? (result.success ? 202 : 400),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }),
});

export default http;
