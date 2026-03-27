
## 1. Overview & Creative North Star
The **Creative North Star** for this design system is **"The Digital Concierge."**

In the high-stakes world of HR Management, "standard" software often feels like a digital filing cabinet—cold, rigid, and utilitarian. This design system rejects that. We are creating an experience that feels like a premium, white-glove service. It is authoritative yet approachable, blending the editorial sophistication of a high-end journal with the playful, helpful spirit of our mascot.

To move beyond the "template" look, we leverage **intentional asymmetry** and **tonal depth**. Rather than a strictly centered grid, we utilize moderate whitespace (the "Normal" spacing mandate) to allow elements to breathe. Content is grouped in organic clusters, using overlapping mascot elements to break the "four corners" of containers, creating a UI that feels alive and curated rather than merely assembled.

---

## 2. Colors & Surface Philosophy
Our palette is anchored by a soft, approachable terracotta, but the sophistication lies in how we layer these tones.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. In a high-end system, boundaries are earned, not forced. Use background color shifts (e.g., a `surface-container-low` card sitting on a `surface` background) to define the edge. This creates a seamless, modern aesthetic that feels infinite rather than boxed-in.

### Surface Hierarchy & Nesting
We treat the UI as a series of physical layers. Use the following tiers to create depth:
*   **Background (`#f8f9fa`):** The canvas.
*   **Surface Container Low:** Standard content areas.
*   **Surface Container Lowest (`#ffffff`):** The "Top Layer." Use this for primary interactive cards to make them "pop" against the light gray background.
*   **Signature Textures:** For main CTAs and "Hero" moments, use a subtle linear gradient from `primary` (#af642d) to `primary_container` (#904f1e). This provides a visual "soul" that flat hex codes cannot achieve.

### The "Glass & Gradient" Rule
For floating elements, such as the mascot’s dialogue bubbles or persistent status bars, use **Glassmorphism**. Apply a semi-transparent `surface` color with a `backdrop-blur` of 12px. This allows the lush terracotta accents of the background to bleed through, softening the interface.

---

## 3. Typography: Editorial Authority
We utilize a dual-typeface system to balance professional trust with modern readability.

*   **Display & Headlines (Manrope):** We use Manrope for all large-scale type. Its geometric yet warm curves mirror the roundness of our mascot. High-contrast sizing (e.g., `display-lg` at 3.5rem) creates an editorial feel that guides the eye with authority.
*   **Body & Labels (Inter):** Inter is our workhorse. It provides maximum legibility for dense HR data.
*   **The Hierarchy Goal:** By pairing a bold, large-scale Manrope headline with a tight, disciplined Inter body, we convey a brand that is both visionary (the "Flow") and detail-oriented (the "Pro").

---

## 4. Elevation & Depth
In "The Digital Concierge," depth is achieved through light and shadow, not lines.

*   **The Layering Principle:** Stacking is our primary tool. Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a natural "lift" through contrast alone.
*   **Ambient Shadows:** When an element must float (like a modal or the mascot), use **Extra-Diffused Shadows**.
*   *Blur:* 40px - 60px.
*   *Opacity:* 4% - 6%.
*   *Color:* Use a tinted shadow (a darkened version of `on-surface`) rather than pure black to keep the light mode feeling airy.
*   **The Ghost Border Fallback:** If a border is required for accessibility, it must be a **Ghost Border**. Use `outline_variant` at 15% opacity. Never use a 100% opaque border.

---

## 5. Components

### The Mascot Integration
The mascot is not just an illustration; he is a UI anchor.
*   **Onboarding:** He should physically overlap containers, breaking the grid to guide users to the "Primary" action.
*   **Empty States:** Use the mascot in high-contrast `secondary_container` backgrounds to turn a "no data" moment into a brand-building moment.

### Primitive Components
*   **Buttons:**
*   *Primary:* Gradient-filled (Terracotta to Warm Brown) with `md` (12px) rounding.
*   *Secondary:* `surface-container-highest` background with `on-surface` text. No border.
*   **Cards & Lists:** **Strictly forbid divider lines.** Use vertical white space (`spacing-6` or `spacing-8`) to separate list items. For complex data, use alternating subtle background shifts between `surface-container-low` and `surface-container-lowest`.
*   **Input Fields:** Use a "soft-inset" style. A `surface-container-high` background with no border. On focus, transition to a `ghost-border` of the primary terracotta.
*   **Chips:** Use `primary_fixed` for active states. They should feel like soft pills, utilizing the `full` roundness token.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use the mascot to provide "emotional feedback" (e.g., a celebratory pose when a leave request is approved).
*   **Do** leverage `surface-bright` for areas meant to draw intense focus.
*   **Do** maintain a minimum of `spacing-4` (1.4rem) between disparate content blocks to preserve the "normal" feel.

### Don’t
*   **Don’t** use pure black (#000000) for text. Use `on_surface` (#191c1d) to keep the contrast professional yet soft.
*   **Don’t** use "Drop Shadows" with small blur radii. It makes the UI look dated and "heavy."
*   **Don’t** box the mascot in. He should always breathe and interact with the whitespace of the page.
*   **Don’t** use dividers. If the content feels cluttered, increase the spacing scale instead of adding a line.