import type { AuthConfig } from "convex/server";
import { getEnv } from "./lib/env";

const issuerDomain = getEnv("CLERK_JWT_ISSUER_DOMAIN");
const applicationID = getEnv("CLERK_APPLICATION_ID") ?? "convex";

export default {
  providers: issuerDomain
    ? [
        {
          domain: issuerDomain,
          applicationID,
        },
      ]
    : [],
} satisfies AuthConfig;
