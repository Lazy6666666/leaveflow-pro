# BALANCE Mobile

Expo-based employee mobile app scaffold for BALANCE.

## Current scope

- Native sign-in screen using Clerk
- Clerk + Convex provider wiring
- Live attendance home screen backed by Convex
- FlashList-backed live history screen
- Account screen with leave summary and session-state bridge
- Local offline attendance queue with evidence persistence and automatic replay into Convex

## Run

1. Copy `.env.example` to `.env`
2. Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Set `EXPO_PUBLIC_CONVEX_URL`
4. Run `npm start`

## Next slice

- Native sign-up and recovery flows
- Camera and location capture for attendance requirements
- Device camera, selfie upload, and live location verification
- Additional device-run validation for iOS and Android
