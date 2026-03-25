export const mobileEnv = {
  clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL ?? "",
};

export const hasMobileBackendEnv = Boolean(
  mobileEnv.clerkPublishableKey && mobileEnv.convexUrl,
);
