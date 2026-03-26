import { createRoot } from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import App from "./App.tsx";
import { convex } from "./lib/convex";
import { AppErrorFallback } from "./components/AppErrorFallback";
import { Sentry, initSentry, isSentryEnabled, registerSentryTestTrigger } from "./lib/sentry";
import "./index.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

initSentry();
registerSentryTestTrigger();

const app = (
  <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/auth">
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <App />
    </ConvexProviderWithClerk>
  </ClerkProvider>
);

createRoot(document.getElementById("root")!).render(
  isSentryEnabled() ? (
    <Sentry.ErrorBoundary fallback={<AppErrorFallback />}>
      {app}
    </Sentry.ErrorBoundary>
  ) : app,
);
