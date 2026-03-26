# Test Spec — Wave 4 Mobile Attendance Experience

## Objective
Define the verification contract for the final mobile attendance wave.

## Required route / UI proof
- mobile attendance home renders on representative mobile viewport
- clock-in/clock-out flow is reachable and usable without desktop-only affordances
- fallback states are shown when device/location/biometric capabilities are unavailable
- attendance history remains reachable

## Required behavior proof
- attendance actions still use the existing role-safe backend path
- history/status updates reflect the recorded action
- no silent failure when permissions/capabilities are denied

## Static verification
- `npx tsc --noEmit`
- targeted eslint on touched mobile/web attendance files
- diagnostics on touched TS/TSX files show zero errors

## Automated tests
- mobile attendance screen render tests
- clock action tests for supported and fallback paths
- regression tests for any touched shared attendance helpers

## Build proof
- relevant build(s) succeed for the touched mobile/web surfaces

## Manual checks
- representative mobile viewport/device flow
- unsupported capability fallback flow
- no regression to existing web attendance/history routes
