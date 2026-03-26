import type { AuthConfig } from "convex/server";
import { getClerkApplicationId, getClerkIssuerDomain } from "./lib/env";

const issuerDomain = getClerkIssuerDomain();
const applicationID = getClerkApplicationId();

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
