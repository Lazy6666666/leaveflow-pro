# Attendance Trust Model Decision

## Executive Summary
This document formalizes the decision process for the Attendance Trust Model within the Leaveflow Pro HR application. The goal is to establish how attendance clock-in/out events are verified, balancing frictionless user experience with accurate time-tracking and fraud prevention.

## Options Evaluated

1. **Supervised Kiosk Mode (Chosen)**
   - **Mechanism:** Employees clock in via a dedicated, physically secured kiosk (e.g., tablet at reception) running the app, or via their own devices with geo-fencing and selfie constraints. A "Trust Review Queue" allows HR to manually inspect flagged or unverified entries (e.g., selfies that look suspicious).
   - **Pros:** Fast implementation, leverages existing selfie capture, high degree of human oversight, low technical complexity.
   - **Cons:** Manual review process for HR can be tedious at scale.

2. **Automated Face-Match Verification**
   - **Mechanism:** Uses a third-party biometric service (e.g., AWS Rekognition, Azure Face API) to automatically compare clock-in selfies against a baseline photo in the employee profile.
   - **Pros:** Completely automated, instant verification, highly scalable.
   - **Cons:** High technical complexity, privacy/compliance concerns (GDPR, biometric data storage), potential vendor lock-in and ongoing costs.

3. **Hybrid Model**
   - **Mechanism:** Initial automated face-match triage. If confidence is below a threshold, the event drops into a manual Trust Review Queue. 
   - **Pros:** Best of both worlds, reduces manual load while handling edge cases.
   - **Cons:** Highest complexity, combining both systems.

## Decision
We are proceeding with **Option 1: Supervised Kiosk Mode (Manual Trust Review)** for the initial phase (Sprints 4-9). 
This allows us to ship the core attendance infrastructure and UI quickly. Biometric face-verification (Option 2/3) is deferred to Sprint 10 as an enhancement.

## Implementation Details (Sprint 4)

1. **New Schema Fields:**
   - `trustState`: `"unverified" | "supervised" | "flagged" | "verified"`
   - `reviewedBy`: User ID of the HR manager.
   - `reviewedAt`: Timestamp of review.
   - `reviewNotes`: Optional text notes.

2. **Data Flow:**
   - Web App / Mobile Clock-ins default to `unverified`.
   - Admin features will allow HR to review the unverified/flagged queue, viewing the captured offline-sync selfies, location data, and timestamps to make a final trust decision.
