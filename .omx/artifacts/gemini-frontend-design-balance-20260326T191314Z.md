# Original user task

Use the Gemini CLI and ensure Gemini uses the `frontend-design` skill when prompting Gemini. The design direction should cover BALANCE auth page and the main web app shell.

# Final prompt sent to Gemini CLI

You must follow this frontend-design skill exactly when responding.

--- BEGIN FRONTEND-DESIGN SKILL ---

`frontend-design` skill content from `/mnt/c/Users/NeilEdwardBaja/.agents/skills/frontend-design/SKILL.md`

--- END FRONTEND-DESIGN SKILL ---

Now apply that skill to BALANCE using this execution brief.

--- BEGIN BALANCE PLAN ---

Full plan content from `.omx/plans/gemini-balance-whole-app-execution-plan.md`

--- END BALANCE PLAN ---

Return a design-led execution brief for BALANCE covering:
1. auth page direction
2. main webapp shell direction
3. dashboard direction
4. mobile shell direction
5. the first implementation batch to take

Keep it implementation-ready and specific to this repo.

# Gemini output (raw)

This execution brief outlines the transformation of **BALANCE** into a cohesive, "Digital Concierge" product. We are moving away from generic SaaS patterns toward a premium, editorial aesthetic that prioritizes warmth, precision, and white-glove service.

### 1. Auth Page: "The Threshold of Order"
The entry point will feel like walking into a high-end concierge lobby rather than a login screen.
*   **Composition**: A dramatic split-screen layout.
    *   **Left (Atmosphere)**: An abstract, high-resolution composition using the terracotta palette, layered with a subtle noise texture and the `FINAL-BAL-01.png` logo as a floating, soft-shadowed element.
    *   **Right (Action)**: The Clerk authentication card, but "Balance-hacked." We will wrap it in a container that uses a soft cream background (`#FDFCFB`), custom typography (refined serif for headings, disciplined sans-serif for labels), and removes all default border-heavy styling in favor of depth and soft shadows.
*   **Motion**: A staggered entry where the left atmospheric panel slides in first, followed by the auth card fading into view.

### 2. Main Web Shell: "The Command Atelier"
The shell is the frame for the user's workflow; it must be invisible yet authoritative.
*   **Sidebar**: Moving away from the "vertical list of links." The new sidebar will use a "layered instrument" feel—no 1px borders. Instead, we use surface contrast (e.g., a warm neutral `#FAF9F6` against a white canvas). Icons will be custom-styled glyphs that feel "etched."
*   **Top Bar**: A floating glassmorphic layer with high-intensity backdrop blur (`20px+`). The Command/Search bar will be an elegant, centered focal point with a minimal "Concierge" prompt.
*   **Status & Feedback**: Network and sync indicators will be integrated as "status jewels"—small, polished dots with subtle pulses, avoiding intrusive banners.

### 3. Dashboard: "The Executive Summary"
The dashboard should feel like a curated briefing, not a data dump.
*   **Greeting**: A bold, editorial-style hero section. "Good Morning, Neil." set in a high-character display font.
*   **Layout**: Asymmetric "Bento" grid. High-priority cards (Attendance, Recent Requests) will have larger footprints and subtle "glass" or "claymorphism" effects.
*   **Surfaces**: Cards will lose their borders. We will use a "terracotta-whisper" background for active states and soft, layered shadows for elevation. Charts will be simplified to their essence, using the brand's warm palette.

### 4. Mobile Shell: "Pocket Precision"
A tactile, high-density experience that feels premium on every tap.
*   **Boot Reveal**: A custom "shutter" loader using the brand terracotta, revealing the app with a spring-based scale animation.
*   **Navigation**: A custom bottom tab bar with "etched" glyphs. The active state won't just change color; it will have a subtle "stamped" depth effect.
*   **Hierarchy**: Headers will use large, authoritative typography that collapses gracefully into a refined, centered title on scroll.

### 5. First Implementation Batch: "Foundation & Stability"
Before the visual overhaul, we must secure the application's core and define the global design language.

1.  **Workstream 1: Boot Recovery & Stability**
    *   Harden `src/main.tsx` and `src/App.tsx` to ensure the public landing is always reachable even if the backend environment is missing.
    *   Refine `BootRecoveryApp.tsx` to match the "Digital Concierge" fallback aesthetic (calm, helpful, not an "error" screen).
2.  **Workstream 2: Global Token Normalization**
    *   Update `src/index.css` to establish the canonical BAL palette: Terracotta (`#A65D43`), Cream (`#FDFCFB`), Warm Charcoal (`#2C2C2C`), and Gold Accents (`#D4AF37`).
    *   Define global typography rules using a serif/sans-serif pairing that avoids the "Inter-everywhere" look.
3.  **Workstream 3: Landing Polish**
    *   Finalize `src/pages/PremiumLanding.tsx` by integrating `FINAL-BAL.svg` and `FINAL-BAL-01.png` into the hero and section layouts.
    *   Ensure the preloader uses the new motion vocabulary (staggered reveal, high-impact typography).

**Next Step**: I will begin with **Workstream 1** to ensure the environment is stable before applying the global tokens.

# Concise summary

Gemini successfully returned a BALANCE design direction under the `frontend-design` skill framing. It reinforced the current direction already being executed in the repo: premium split auth page, refined concierge shell, executive-summary dashboard, and tactile mobile shell.

# Action items / next steps

1. Use Gemini’s auth and shell direction as the canonical visual brief for the remaining auth/main-shell refinements.
2. Continue implementation in the current repo using the BAL token layer, premium split auth composition, and “Command Atelier” shell language.
3. Run visual verification against the BAL reference once the current web build/test cycle finishes.
