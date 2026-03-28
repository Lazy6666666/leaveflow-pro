# Balance UI/UX Design System (DESIGN.md)

This is the canonical source of truth for the **Balance** (Leaveflow Pro) brand identity and UI token system.
Aesthetic Direction: **"Refined Monochrome Precision"** — architectural, high-contrast, editorial, avoiding generic rounded SaaS clichés.

---

## 1. Typography

We avoid overused neutral fonts (Inter, Roboto) in favor of high-character, modern geometric clarity.

### Font Families
- **Display & Headings:** `Outfit` (Bold, structural, varying weights)
- **Body & UI Text:** `Satoshi` or `Geist` (Clean, highly legible, strong character)
- **Monospace/Numbers:** `Geist Mono` or `JetBrains Mono` (Used strictly for data, metrics, and tabular numbers)

### Size Scale (Tailwind mapped)
- `text-xs` (12px / 0.75rem) — Metadata, timestamps, tiny labels
- `text-sm` (14px / 0.875rem) — Dense table data, secondary text
- `text-base` (16px / 1rem) — Default body text, form inputs
- `text-lg` (18px / 1.125rem) — Subtitles, prominent card text
- `text-xl` (20px / 1.25rem) — Section headers
- `text-2xl` (24px / 1.5rem) — Page titles (Mobile), featured stats
- `text-3xl` (30px / 1.875rem) — Page titles (Desktop)
- `text-4xl` (36px / 2.25rem) — Hero display small
- `text-5xl` (48px / 3rem) — Hero display large

### Weight Usage
- **Regular (400):** Body copy, secondary text
- **Medium (500):** Button labels, active nav items, table headers
- **SemiBold (600):** Section headings, crucial data points
- **Bold (700):** Display headers only

---

## 2. Color Palette

A stark, high-contrast foundation with a single, aggressive accent color. No soft purple gradients or timid grays.

### Core Tones
| Token | Light Mode Value | Dark Mode Value | Usage |
|-------|------------------|-----------------|-------|
| `bg-background` | `#FFFFFF` | `#0A0A0A` | Main page background |
| `bg-surface` | `#FAFAFA` | `#121212` | Card/panel background |
| `border-subtle` | `#E5E5E5` | `#262626` | Dividers, subtle borders |
| `border-strong` | `#A3A3A3` | `#404040` | Input borders, active states |
| `text-primary` | `#090A0B` | `#F5F5F5` | Main headings, core body text |
| `text-secondary`| `#525252` | `#A3A3A3` | Muted text, captions |

### Accent Color: Electric Ultramarine
A sharp, energetic blue to drive action and focus.
- `accent-light`: `#335CFF` (Hover states)
- `accent-main`: `#002BFF` (Primary buttons, active indicators)
- `accent-dark`: `#001ACC` (Pressed states)

### Semantic Colors
Desaturated slightly to avoid screaming at the user.
- **Success (`badge-success`/`text-success`):** `#059669` (Light) / `#10B981` (Dark)
- **Warning (`badge-warning`/`text-warning`):** `#D97706` (Light) / `#F59E0B` (Dark)
- **Error (`badge-error`/`text-error`):** `#DC2626` (Light) / `#EF4444` (Dark)
- **Info (`badge-info`/`text-info`):** Tied directly to the Accent color (`#002BFF`)

---

## 3. Spacing System

Generous whitespace. Use Tailwind's default spacing scale, but enforce these optical rules:
- **`space-y-1` (4px):** Between an icon and text, or a label and input.
- **`space-y-4` (16px):** Standard gap between stacked form elements.
- **`space-y-8` (32px):** Between unrelated UI components inside a card.
- **`space-y-16` (64px):** Between major page sections.
- **PADDING:** Cards use `p-6` or `p-8`. AVOID dense `p-4` unless on mobile.

---

## 4. Border Radii & Borders

We reject the "pill-shaped everything" generic look. Balance is architectural.
- `rounded-none` (0px) — Full-width banners, sharp inner images.
- `rounded-sm` (2px) — Badges, small tooltips, checkboxes.
- `rounded-md` (4px) — Buttons, form inputs.
- `rounded-xl` (12px) — Cards, modals, floating panels (softer exterior to contrast sharp interiors).

**Borders:**
Every component that separates content uses a harsh 1px solid border (`border-subtle`) rather than relying on shadow.

---

## 5. Shadows & Elevation

Shadows must be tinted to the background, never pure black smudges. Wait, for monochrome, shadows are extremely stark and calculated.
- `shadow-sm`: `0 1px 2px rgba(0,0,0, 0.05)` (Input fields)
- `shadow-md`: `0 4px 12px rgba(0,0,0, 0.08)` (Dropdown menus)
- `shadow-float`: `0 12px 32px rgba(0,0,0, 0.12), 0 0 0 1px rgba(0,0,0, 0.05)` (Modals, floating AI chat workspace)

---

## 6. Component Guidelines

### Buttons
- **Primary:** `bg-accent-main text-white rounded-md font-medium transition-transform active:scale-[0.98]`
- **Secondary:** `bg-transparent border border-border-strong text-text-primary hover:bg-surface`
- **Ghost:** `bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface border-transparent`

### Badges
- **Pill vs Square:** Square badges (`rounded-sm`). Avoid pill shapes.
- **Styling:** Subtle backgrounds with harsh text contrast (e.g., `bg-emerald-500/10 text-emerald-600 border border-emerald-500/20`).

### Cards & Layouts
- **Bento Grids:** Use CSS grid with 1px gap on a gray background to create sharp 1px borders automatically (`gap-[1px] bg-border-subtle`, with child items `bg-surface`).
- **Asymmetry:** Let headers span 2 columns while related stats stack in 1 column.

---

## 7. Motion & Interaction

- **Easing:** Global standard is `cubic-bezier(0.16, 1, 0.3, 1)` (snappy, physical).
- **Duration:** `duration-200` for hover, `duration-300` for page mounts.
- **Focus Rings:** Non-negotiable. `focus-visible:ring-2 focus-visible:ring-accent-main focus-visible:ring-offset-2`.

---

## 8. Logo & Branding Usage

- **Clear Space:** Minimum 1x the height of the logomark clear on all sides.
- **Minimum Size:** Never render the emblem smaller than 24x24px.
- **Colors:** Logo must only be rendered in pure Black, pure White, or the primary Electric Ultramarine. Never gray or semantic colors.
- **Placement:** Top left of all navigation.

---

## 9. Tailwind Class Mapping (TWI-16 Reference)
When configuring `tailwind.config.ts`, map these exact theme extensions:
```javascript
theme: {
  extend: {
    colors: {
      background: "var(--background)",     // #FFFFFF / #0A0A0A
      surface: "var(--surface)",           // #FAFAFA / #121212
      border: {
        subtle: "var(--border-subtle)",    // #E5E5E5 / #262626
        strong: "var(--border-strong)",    // #A3A3A3 / #404040
      },
      accent: {
        light: "var(--accent-light)",      // #335CFF
        main: "var(--accent-main)",        // #002BFF
        dark: "var(--accent-dark)",        // #001ACC
      },
      // Insert semantic colors here
    },
    fontFamily: {
      display: ['var(--font-outfit)', 'sans-serif'],
      body: ['var(--font-satoshi)', 'sans-serif'],
      mono: ['var(--font-geist-mono)', 'monospace'],
    },
    boxShadow: {
      float: "var(--shadow-float)",
    }
  }
}
```
*Note: CSS variables must be defined in `index.css` for runtime Light/Dark mode switching.*
