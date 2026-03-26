# PRD — Wave 4 Mobile Attendance Experience

## Status
- Derived from `.omx/plans/prd-all-features-staged-execution.md`
- Execution mode: final roadmap wave
- Scope: mobile attendance only

## Objective
Deliver a materially better mobile-first attendance experience than the current desktop-responsive fallback.

## In scope
- mobile-first attendance home/shell
- attendance entry workflow tuned for constrained mobile interaction
- clear fallback behavior for unsupported device capabilities
- preserve existing role-safe attendance and history flows

## Out of scope
- full native app rewrite
- new biometric vendor integrations
- QR/location/device capabilities that cannot be supported safely by the current platform stack
- unrelated admin/HR flows

## Architecture contract
- prefer the existing `apps/mobile` project for dedicated mobile-first execution
- keep web attendance flows intact unless a shared helper must be extracted
- use additive/shared attendance helpers where behavior overlaps, not duplicate business rules
- route all mobile attendance actions through the existing Convex attendance surfaces unless a clearly missing backend hook is required

## Acceptance criteria
- mobile attendance flow is materially better than the current responsive fallback
- core clock-in/clock-out actions remain role-safe
- attendance history remains accessible and correct
- unsupported capabilities show explicit fallback guidance instead of silent failure
- no regression to existing web attendance/history/identity flows
