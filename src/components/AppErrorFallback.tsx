export function AppErrorFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">BALANCE</p>
          <h1 className="text-2xl font-semibold tracking-tight">The app hit an unexpected error.</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            The issue has been recorded. Reload the app to try again. If the problem continues, contact your HR admin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Reload app
        </button>
      </div>
    </div>
  );
}
