# BALANCE Whole-App Execution Plan for Gemini

## 1. Mission

Take the existing `leaveflow-pro` repo and turn it into one coherent BALANCE product across:

- public web landing
- web auth flow
- authenticated web shell and dashboard surfaces
- Expo mobile app shell and attendance-first mobile experience
- Android native build path

The result must feel like one premium product system, not a collection of disconnected pages and prototypes.

The visual system must follow:

- `D:\Downloads\DESIGN.md` ("Digital Concierge")
- BAL reference app at `C:\Users\NeilEdwardBaja\Desktop\New folder\2026-BAL-compare`
- logo assets:
  - `public/FINAL-BAL.svg`
  - `public/FINAL-BAL-01.png`

## 2. Current Repo Reality

### Already implemented or partially implemented

1. **Web boot recovery**
- `src/main.tsx`
- `src/App.tsx`
- `src/components/BootRecoveryApp.tsx`

This work already moved the web app away from hard-crashing when Clerk/Convex env is missing. The public landing should remain reachable while protected routes fall back to a controlled recovery/setup state.

2. **Landing redesign in progress**
- `src/index.css`
- `src/pages/PremiumLanding.tsx`
- `src/components/landing/*`

The old dark premium direction has already been shifted toward a BAL-aligned light terracotta system.

3. **Auth + main shell redesign in progress**
- `src/pages/Auth.tsx`
- `src/components/AppLayout.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/ui/Logo.tsx`
- `src/pages/Dashboard.tsx`

4. **Expo mobile shell redesign in progress**
- `apps/mobile/App.tsx`
- `apps/mobile/src/navigation/AppTabs.tsx`
- `apps/mobile/src/theme/tokens.ts`
- `apps/mobile/src/components/chrome/*`
- `apps/mobile/src/screens/AttendanceHomeScreen.tsx`
- `apps/mobile/src/screens/AttendanceHistoryScreen.tsx`
- `apps/mobile/src/screens/AccountScreen.tsx`

5. **Android native dependency/build work in progress**
- `apps/mobile/package.json`
- `apps/mobile/package-lock.json`
- `apps/mobile/android/gradle.properties`

### Known blockers / risks

1. **Windows Android build path remains unstable**
- device/debug path works
- ADB works
- Temurin 17 is installed
- Expo/Gradle still hit Windows host loopback/daemon issues intermittently

2. **Gemini CLI is not usable from current WSL execution path**
- Windows wrapper errors with vsock startup failure
- direct Node CLI path hangs without usable output

3. **The app still has fragmented UX**
- landing, auth, dashboard, and mobile are closer now but still not fully unified
- dashboard internals and some secondary pages still use older visual language

## 3. Non-Negotiable Product Goals

Gemini must preserve these outcomes:

1. **One brand system everywhere**
- same logo language
- same color family
- same type hierarchy
- same surface philosophy
- same loading/error/empty-state quality

2. **The loader stays**
- user explicitly wants a loading/preloader experience
- it must be redesigned, not removed

3. **BAL reference is visual inspiration only**
- do not import Firebase/backend architecture from `2026-BAL-compare`
- only borrow layout, motion, tone, UI patterns, and premium composition

4. **The Android app must stop feeling skeletal**
- real navigation
- real icons/glyphs
- real hierarchy
- meaningful states
- attendance-first but not visually bare

5. **Do not break route/auth behavior**
- redesign the shell without changing core route intent
- boot recovery must remain intact

## 4. Global Design System To Enforce

Gemini must apply the following system globally:

### A. Creative direction
- "Digital Concierge"
- premium, white-glove, calm, editorial, warm, precise
- authoritative but approachable
- not generic SaaS, not dark AI purple, not startup cliché

### B. Color and surface rules
- warm terracotta-led palette
- layered warm neutrals
- no harsh 1px divider-line-driven layouts
- use surface contrast and depth instead of boxy card spam
- glassmorphism only where it creates a premium floating layer

### C. Typography
- strong display type with editorial authority
- disciplined body typography
- no generic Inter-everywhere feel on headline surfaces
- auth, landing, dashboard, and mobile titles must all feel part of one family

### D. Layout philosophy
- asymmetry over generic centered hero layouts
- split compositions
- bento-like organization where appropriate
- whitespace as structure
- no repetitive equal-card SaaS rows when a more intentional composition is possible

### E. Component philosophy
- no default shadcn-looking surfaces
- no raw generic sidebars/cards/buttons left uncustomized
- stronger empty, loading, and recovery states

## 5. Workstreams Gemini Should Execute

## Workstream 1: Finish Web Boot Stability

### Goal
Ensure the web app always loads into either:
- public landing
- auth flow
- controlled recovery/setup state

### Files
- `src/main.tsx`
- `src/App.tsx`
- `src/components/BootRecoveryApp.tsx`

### Requirements
- no hard crash on missing env
- no infinite refresh loop on lazy route failure
- public landing always reachable
- protected surfaces route to controlled fallback if backend/auth env is unavailable

### Acceptance
- `/` loads
- missing auth env shows controlled fallback, not blank screen or thrown error

## Workstream 2: Finalize Global Web Token Layer

### Goal
Turn the current BAL landing token direction into the canonical global web design layer.

### Files
- `src/index.css`
- any shared utility styles required by auth/shell/dashboard

### Requirements
- normalize BAL palette/tokens
- ensure auth, dashboard, sidebar, and landing use the same token vocabulary
- remove remaining conflicting visual language

### Acceptance
- one coherent token system
- no obvious dark-old-vs-light-new mismatch across major web surfaces

## Workstream 3: Finish BAL Landing

### Goal
Make the public landing feel like the polished BAL product front door.

### Files
- `src/pages/PremiumLanding.tsx`
- `src/components/landing/*`

### Requirements
- use `FINAL-BAL.svg` and `FINAL-BAL-01.png`
- keep loader/preloader concept
- use BAL reference composition and movement language
- preserve accessibility and real links

### Acceptance
- landing visually aligned with BAL reference
- landing test coverage still passes
- no generic “AI SaaS hero” feel remains

## Workstream 4: Redesign Auth Page

### Goal
Make auth feel like a premium entry portal into BALANCE, not a Clerk page dropped into a generic shell.

### Files
- `src/pages/Auth.tsx`
- `src/components/ui/Logo.tsx`

### Requirements
- BAL brand framing
- strong left/right composition or similarly intentional layout
- Clerk card embedded into a branded BAL shell
- preserve sign-in / sign-up behavior
- keep theme toggle if still justified, but style it to the BAL system

### Acceptance
- `Auth.test.tsx` passes
- auth page visually matches landing/system rather than feeling separate

## Workstream 5: Redesign Main Web Shell

### Goal
Make the authenticated app shell feel premium and integrated, not like a stock dashboard frame.

### Files
- `src/components/AppLayout.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/ui/Logo.tsx`
- `src/components/NetworkStatusBanner.tsx`
- `src/components/OfflineSyncStatusBadge.tsx`
- related shell surfaces if needed

### Requirements
- sidebar redesigned to BAL language
- top bar redesigned to BAL language
- command/search surface should feel intentional
- preserve all current behavior
- do not break AI panel, notifications, request sheet, command palette

### Acceptance
- `AppLayout.test.tsx` passes
- shell feels like BAL, not default component-library chrome

## Workstream 6: Redesign Dashboard Surface

### Goal
Bring the main dashboard content itself up to the same standard as the shell.

### Files
- `src/pages/Dashboard.tsx`
- possibly supporting dashboard components already used there

### Requirements
- hero/greeting area must feel premium and not generic
- cards need BAL surface treatment
- spacing, charts, and summaries should feel curated
- preserve all functional query/data behavior

### Acceptance
- dashboard reads as part of the BAL system
- no stock-card SaaS look dominates the first screen

## Workstream 7: Finish Expo Mobile BAL Shell

### Goal
Make the mobile app feel like a real BAL product, not a prototype.

### Files
- `apps/mobile/App.tsx`
- `apps/mobile/src/navigation/AppTabs.tsx`
- `apps/mobile/src/theme/tokens.ts`
- `apps/mobile/src/components/chrome/*`
- `apps/mobile/src/screens/AttendanceHomeScreen.tsx`
- `apps/mobile/src/screens/AttendanceHistoryScreen.tsx`
- `apps/mobile/src/screens/AccountScreen.tsx`

### Requirements
- proper branded loading shell
- branded tab bar with icons/glyphs
- richer headers and hierarchy
- BAL-aligned palette and surfaces
- preserve auth/session/attendance behavior

### Acceptance
- mobile typecheck passes
- mobile auth/attendance tests pass
- home/history/profile no longer feel minimal or skeletal

## Workstream 8: Android Build Compatibility

### Goal
Get the Expo Android app building on the real device path.

### Files
- `apps/mobile/package.json`
- `apps/mobile/package-lock.json`
- `apps/mobile/android/gradle.properties`
- any minimal Android/build config strictly required

### Current known issue
- build path has fought with host Windows loopback/Gradle/JDK behavior
- Clerk native/codegen issue also surfaced earlier

### Requirements
- use the smallest dependency/config changes needed
- do not destabilize the mobile app architecture
- verify actual on-device launch when build succeeds

### Acceptance
- `npx expo run:android --no-install` succeeds on Windows host
- app launches on connected device

## Workstream 9: Secondary Web Pages

### Goal
After the main surfaces are coherent, bring the other routed product pages into alignment.

### Candidate surfaces
- `src/pages/MyLeave.tsx`
- `src/pages/Holidays.tsx`
- hub pages
- relevant admin/manager pages exposed from the shell

### Requirement
- do not let the app become a mix of BAL-designed and old generic pages

### Acceptance
- secondary pages at least inherit the new shell/tokens cleanly
- visible first-order mismatches are removed

## 6. Verification Gemini Must Run

### Required
1. `npx tsc --noEmit`
2. `npx tsc --noEmit -p apps/mobile/tsconfig.json`
3. `npm run build`
4. targeted web tests:
   - `src/pages/Auth.test.tsx`
   - `src/components/AppLayout.test.tsx`
   - `src/pages/PremiumLanding.accessibility.test.tsx`
   - `src/components/landing/LandingSections.accessibility.test.tsx`
5. targeted mobile tests:
   - `apps/mobile/src/providers/authSync.test.ts`
   - `apps/mobile/src/lib/attendanceFlow.test.ts`
   - `apps/mobile/src/screens/authFlow.test.ts`

### Visual QA required
Use `visual-verdict` after the redesign against:
- BAL landing reference capture
- current BALANCE landing capture
- auth page capture
- app shell/dashboard capture
- mobile primary screens once Android runtime is working

Target:
- `score >= 90`

## 7. Constraints Gemini Must Respect

1. Do not rewrite the app from scratch.
2. Work with the existing stack:
- Vite web app
- Tailwind v3 web styling
- Expo React Native mobile app

3. Do not import the BAL reference backend architecture.
4. Preserve the route/auth logic.
5. Preserve the loading/preloader concept.
6. Keep changes reviewable by subsystem.
7. Prefer official dependency upgrades over `node_modules` hacks.

## 8. Suggested Execution Order

1. Web boot recovery
2. Global token system
3. Landing
4. Auth
5. Main shell
6. Dashboard
7. Mobile shell
8. Android build path
9. Secondary pages
10. Visual QA + regression pass

## 9. Definition of Done

The work is only done when:

1. The public web app loads without hard crash.
2. The landing is BAL-aligned and premium.
3. Auth and dashboard shell match the same design system.
4. The main dashboard itself feels premium, not generic.
5. The mobile app no longer feels skeletal.
6. Android app builds and launches on device.
7. Typechecks pass.
8. Targeted tests pass.
9. Visual-verdict scores are acceptable.
10. The product reads as one BALANCE system across web and mobile.

## 10. Explicit Current Repo Touchpoints

Primary web files:
- `src/main.tsx`
- `src/App.tsx`
- `src/components/BootRecoveryApp.tsx`
- `src/index.css`
- `src/pages/PremiumLanding.tsx`
- `src/components/landing/*`
- `src/pages/Auth.tsx`
- `src/components/AppLayout.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/ui/Logo.tsx`
- `src/pages/Dashboard.tsx`

Primary mobile files:
- `apps/mobile/App.tsx`
- `apps/mobile/src/navigation/AppTabs.tsx`
- `apps/mobile/src/theme/tokens.ts`
- `apps/mobile/src/components/chrome/*`
- `apps/mobile/src/screens/AttendanceHomeScreen.tsx`
- `apps/mobile/src/screens/AttendanceHistoryScreen.tsx`
- `apps/mobile/src/screens/AccountScreen.tsx`
- `apps/mobile/package.json`
- `apps/mobile/package-lock.json`
- `apps/mobile/android/gradle.properties`

Reference sources:
- `D:\Downloads\DESIGN.md`
- `C:\Users\NeilEdwardBaja\Desktop\New folder\2026-BAL-compare`
- `public/FINAL-BAL.svg`
- `public/FINAL-BAL-01.png`
