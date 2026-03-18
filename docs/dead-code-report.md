# Dead Code Analysis Report — BALANCE / leaveflow-pro

**Generated:** 2026-03-18  
**Scope:** Full codebase — frontend (`src/`), backend (`convex/`), shared libs, hooks, remotion  
**Policy:** No deletions made. Report only. Apply removals after manual confirmation.

---

## 1. SAFE TO REMOVE
> Confidence ≥ 95%. Zero references found after project-wide validation.

| # | File | Symbol | Type | Validation |
|---|------|---------|------|------------|
| 1 | `src/components/ui/use-toast.ts` | entire file | module | Duplicate — `src/hooks/use-toast.ts` is canonical (8 importers). This file has 0 importers. |
| 2 | `src/remotion/sections/Springs.ts` | `SPRING_CONFIG`, `SOFT_SPRING` | exports | 0 references in any remotion section or LandingVideo. |
| 3 | `src/components/ui/HeroParallax.tsx` | `HeroParallax` | component | 0 imports. `parallax-hero-images.tsx` is used instead. |
| 4 | `src/components/ui/Preloader.tsx` | `Preloader` | component | 0 imports anywhere. |
| 5 | `src/components/ui/background-gradient-animation.tsx` | `BackgroundGradientAnimation` | component | 0 imports anywhere. |
| 6 | `src/components/landing/FeaturesGridSecondary.tsx` | entire file | component | 0 external imports. Only self-references `skiper39`. |
| 7 | `src/components/landing/LogosBlurFlip.tsx` | entire file | component | 0 imports anywhere. |
| 8 | `src/components/landing/ProblemManifest.tsx` | entire file | component | 0 imports anywhere. Internal `MagicRings` ref is local only. |
| 9 | `src/components/landing/StatsRow.tsx` | entire file | component | 0 imports anywhere. |
| 10 | `src/components/landing/Testimonials.tsx` | entire file | component | 0 imports anywhere. |
| 11 | `src/components/landing/PricingTier.tsx` | entire file | component | 0 imports anywhere. |
| 12 | `src/pages/admin/SiteDashboard.tsx` | entire file | page | 0 imports anywhere. Not in `App.tsx`, not in any Hub. |
| 13 | `src/components/Threads.tsx` | entire file | component | 0 imports anywhere. OGL WebGL canvas, never mounted. |

---

## 2. POSSIBLY UNUSED — Manual Review Required
> Confidence 60–94%. Requires intent confirmation before removal.

| # | File | Symbol | Type | Concern | Confidence |
|---|------|---------|------|---------|------------|
| 1 | `src/pages/EtherealLanding.tsx` | `EtherealLanding` | page | Not in `App.tsx`. `Index.tsx` renders `PureWhiteLanding`. Was the intent to swap these? | 70% |
| 2 | `src/components/PaymentCard.tsx` | `PaymentCard` | component | 0 imports. Stripe is installed and configured but this component is never mounted. | 85% |
| 3 | `src/components/StripeProvider.tsx` | `StripeProvider` | component | 0 imports. Stripe packages present but provider never wraps anything in the app. | 85% |
| 4 | `src/components/landing/FeaturesGrid.tsx` | `FeaturesGrid` | component | 0 external imports. Only self-references `AnimatedBeam`. | 80% |
| 5 | `src/components/MagicRings.tsx` | `MagicRings` | component | Only referenced by `FeaturesGrid` and `ProblemManifest` — both themselves unused. | 75% |
| 6 | `src/components/ui/AnimatedBeam.tsx` | `AnimatedBeam` | component | Only referenced by `FeaturesGrid` — which is itself unused. | 75% |
| 7 | `src/remotion/HeroVideo.tsx` | `HeroVideo` | composition | Registered in `Root.tsx` for Remotion Studio only. Never embedded in the app. | 65% |
| 8 | `src/remotion/MarketingVideo.tsx` | `MarketingVideo` | composition | Same as above — Remotion Studio only, no app embed. | 65% |

---

## 3. SHARED DEPENDENCY — Must Keep

| File | Reason |
|------|--------|
| `src/lib/convexApi.ts` | Re-exports `api` — used by 30+ files |
| `src/lib/errors.ts` | `getErrorMessage` — used by 25+ files |
| `src/lib/convexTypes.ts` | Convex ID types — used by 20+ files |
| `src/lib/csv.ts` | Used by AuditLog, Employees, LeaveHistory |
| `src/lib/offlineQueue.ts` | Used by AppLayout, NetworkStatusBanner, ClockInOut |
| `src/lib/puter.ts` | Used by `puterChat.ts` → `useAIChatController` |
| `src/lib/puterChat.ts` | Used by `useAIChatController` (AI fallback path) |
| `convex/admin.ts` | Barrel re-export — all `api.admin.*` frontend calls route through it |
| `convex/attendance.ts` | Barrel re-export — same pattern |
| `convex/lib/*` | All files used by multiple convex backend modules |
| All Hub sub-pages | Imported by Hub pages, not directly by `App.tsx` — this is intentional |

---

## 4. RUNTIME DEPENDENT — Must Keep

| File | Reason |
|------|--------|
| `convex/crons.ts` | Scheduled jobs — no frontend import needed by design |
| `convex/http.ts` | HTTP action handlers — invoked by webhooks/external calls |
| `convex/httpRateLimits.ts` | Middleware for HTTP routes |
| `convex/httpSecurity.ts` | Middleware for HTTP routes |
| `convex/notificationScheduler.ts` | Cron-triggered |
| `convex/absenceNotifications.ts` | Cron-triggered |
| `convex/leaveNotifications.ts` | Event-triggered by leave mutations |
| `convex/leaveNotificationEmails.ts` | Called internally by leave mutations |
| `convex/backendIncidents.ts` | Internal backend error tracking |
| `convex/auth.config.ts` | Convex auth configuration — framework-required |

---

## 5. Summary

| Category | Count |
|----------|-------|
| Safe to delete | 13 files |
| Needs manual review | 8 items |
| Must keep (shared) | 11+ |
| Must keep (runtime) | 10 |

### Recommended next action
1. Delete all 13 items in Section 1 — zero risk.
2. Confirm intent on `EtherealLanding` (swap with `PureWhiteLanding` in `Index.tsx`?).
3. Confirm whether Stripe (`PaymentCard`, `StripeProvider`) is planned or abandoned.
4. Confirm whether `HeroVideo` / `MarketingVideo` are needed for Remotion Studio renders.
