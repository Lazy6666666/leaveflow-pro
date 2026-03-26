# Context Snapshot — repo debt finalize

## Task statement
Finish the remaining repo-wide debt after the delivered Wave 1-4 feature scope by fixing the current broad typecheck blockers and the highest-signal remaining audit issues, then package and push the result to `main`.

## Desired outcome
- clear the currently reported `apps/mobile/tsconfig.json` blockers
- keep the already-delivered Wave 3/4 behavior intact
- reduce the remaining high-severity dependency audit items where low-risk fixes exist
- finish with a commit and push to `origin/main`

## Known facts / evidence
- Product scope for Waves 1-4 is implemented.
- Main app verification already succeeded earlier:
  - `npx tsc --noEmit`
  - targeted Wave 3 tests
  - targeted Wave 4 mobile tests
  - `npm run build`
- Current remaining mobile/Convex typecheck errors are:
  - `apps/mobile/src/providers/AppProviders.tsx`
  - `apps/mobile/src/providers/authSync.test.ts`
  - `apps/mobile/src/screens/AccountScreen.tsx`
  - `convex/adminBalances.ts`
  - `convex/adminBiometrics.ts`
  - `convex/attendanceAdmin.ts`
  - `convex/attendanceEmployee.ts`
  - `convex/payroll.ts`
- Current remaining high-severity audit set includes packages such as:
  - `glob`
  - `minimatch`
  - `picomatch`
  - plus a small number of moderate items
- `react-router-dom` has already been moved to `6.30.3`.

## Constraints
- No git worktrees.
- Preserve delivered feature behavior.
- Keep fixes scoped to the current blockers instead of broad cleanup.
- Push directly to `main` when the final gates pass.

## Likely touchpoints
- `apps/mobile/src/providers/AppProviders.tsx`
- `apps/mobile/src/providers/authSync.test.ts`
- `apps/mobile/src/screens/AccountScreen.tsx`
- `apps/mobile/tsconfig.json`
- `convex/adminBalances.ts`
- `convex/adminBiometrics.ts`
- `convex/attendanceAdmin.ts`
- `convex/attendanceEmployee.ts`
- `convex/payroll.ts`
- `package.json`
- `package-lock.json`
