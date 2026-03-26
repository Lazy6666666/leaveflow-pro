# Test Spec — Wave 2 Performance Reviews + Training + Certifications

## Objective
Define the verification contract for the Wave 2 people-development slice.

## Required backend proof
- `convex/performanceReviews.ts` provides query/mutation coverage for review cycles and assignments
- `convex/training.ts` provides query/mutation coverage for courses, assignments, and certifications
- schema additions remain additive and isolated to Wave 2 entities

## Required route / UI proof
- HR Operations hub exposes Reviews, Training, and Certifications tabs
- review cycle creation renders and saves
- training course creation renders and saves
- certification record creation renders and saves

## Regression proof
- no regression to Wave 1 Recruitment / Onboarding tabs
- no regression to existing HR Operations tabs
- `AppLayout` / command palette / landing regressions are out of scope unless touched

## Static verification
- `npx tsc --noEmit`
- targeted eslint on touched files with zero errors

## Automated tests
- panel tests for Reviews, Training, Certifications components
- HR Operations hub tab visibility test updates

## Build proof
- `npm run build`
