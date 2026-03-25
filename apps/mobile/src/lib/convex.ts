import { ConvexReactClient } from "convex/react";

import { mobileEnv } from "../config/env";

export const convexClient = mobileEnv.convexUrl
  ? new ConvexReactClient(mobileEnv.convexUrl)
  : null;
