import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import Index from "@/pages/Index";

type BootRecoveryAppProps = {
  missing: string[];
};

function RecoveryBanner({ missing }: { missing: string[] }) {
  return (
    <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50/95 px-4 py-3 text-amber-950 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
            Startup recovery
          </p>
          <p className="max-w-3xl text-sm leading-6 text-amber-900">
            BALANCE loaded the public experience, but app services are offline because the
            following env vars are missing: {missing.join(", ")}.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-amber-300 bg-white px-4 text-sm font-medium text-amber-950 transition-colors hover:bg-amber-100"
          to="/boot-recovery"
        >
          Open setup status
        </Link>
      </div>
    </div>
  );
}

function RecoveryStatus({ missing }: { missing: string[] }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-2xl rounded-[2rem] bg-card p-8 shadow-sm ring-1 ring-black/5">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            BALANCE boot recovery
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            The public app is available, but protected routes are paused.
          </h1>
          <p className="max-w-[65ch] text-sm leading-6 text-muted-foreground">
            Clerk and Convex are required for the authenticated product shell. Until the
            missing environment values are restored, BALANCE will keep the marketing
            surface online and route protected pages here instead of failing at startup.
          </p>
        </div>

        <div className="mt-8 rounded-[1.5rem] bg-muted/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Missing environment
          </p>
          <ul className="mt-3 space-y-2">
            {missing.map((item) => (
              <li
                key={item}
                className="rounded-xl bg-background px-4 py-3 font-mono text-sm text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            to="/"
          >
            Return to landing
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Retry startup
          </button>
        </div>
      </div>
    </main>
  );
}

export function BootRecoveryApp({ missing }: BootRecoveryAppProps) {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <RecoveryBanner missing={missing} />
              <Index />
            </>
          }
        />
        <Route path="/boot-recovery" element={<RecoveryStatus missing={missing} />} />
        <Route path="*" element={<RecoveryStatus missing={missing} />} />
      </Routes>
    </BrowserRouter>
  );
}
