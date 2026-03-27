import { createRoot } from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import App from "./App.tsx";
import { AppErrorFallback } from "./components/AppErrorFallback";
import { BootRecoveryApp } from "./components/BootRecoveryApp";
import { Sentry, initSentry, isSentryEnabled, registerSentryTestTrigger } from "./lib/sentry";
import "./index.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convexUrl = import.meta.env.VITE_CONVEX_URL;
const missingEnvironment = [
  !clerkPublishableKey ? "VITE_CLERK_PUBLISHABLE_KEY" : null,
  !convexUrl ? "VITE_CONVEX_URL" : null,
].filter(Boolean) as string[];

initSentry();
registerSentryTestTrigger();

const root = createRoot(document.getElementById("root")!);

function renderApp(app: React.ReactNode) {
  root.render(
    isSentryEnabled() ? (
      <Sentry.ErrorBoundary fallback={<AppErrorFallback />}>
        {app}
      </Sentry.ErrorBoundary>
    ) : app,
  );
}

async function bootstrap() {
  if (missingEnvironment.length > 0) {
    renderApp(<BootRecoveryApp missing={missingEnvironment} />);
    return;
  }

  const { convex } = await import("./lib/convex");

  renderApp(
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/auth">
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>,
  );
}

void bootstrap();
