# Context Snapshot — Wave 4 mobile attendance

## Task statement
Proceed to the final roadmap wave after verified Wave 3 completion: dedicated mobile attendance experience.

## Desired outcome
Start a bounded final-wave implementation focused on mobile attendance UX, safe device fallbacks, and preserved backend behavior.

## Known facts / evidence
- Wave 3 expenses, policy acknowledgements, integrations, and AI feed slices are implemented and locally verified.
- Existing mobile code already exists under `apps/mobile/`.
- Existing attendance flows already exist in both web and mobile surfaces.
- The roadmap explicitly requires Wave 4 to remain role-safe and fallback-aware.

## Constraints
- Preserve existing attendance/history/identity behavior.
- Do not broaden into a full mobile platform rewrite.
- Keep unsupported capability handling explicit.

## Likely touchpoints
- `apps/mobile/src/screens/*`
- `apps/mobile/src/components/attendance/*`
- `apps/mobile/src/hooks/*`
- `apps/mobile/src/lib/*`
- shared attendance Convex modules if a backend gap is discovered
