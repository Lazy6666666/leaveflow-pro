# BALANCE Design System
> Output of the advanced-systematic-frontend-design Phase 0 workflow.
> All new screens in Sprints 1–10 MUST inherit these rules. Do not deviate without updating this doc.

---

## 1. Product Context

```
Product:  BALANCE — HR, Attendance & Leave Management SaaS
Industry: HR Tech / Workforce Management
Users:
  - Employees         → clock in/out, check leave balance, request leave
  - Managers          → approve leave, view team attendance, review exceptions
  - HR Admins         → full admin: shifts, rosters, sites, payroll, trust review
  - Site Supervisors  → scoped attendance and biometrics view per site
Tasks:
  - Mobile attendance capture (speed, reliability, offline)
  - Leave requests and approvals
  - Shift/roster scheduling
  - Payroll summary, export, exception review
  - Biometrics and trust verification
  - AI-assisted workforce analysis
Platform:  Desktop web (primary) + Mobile PWA (attendance-critical path)
Usage env: Office desks (admin, manager) + Field/outdoor (employees, mobile)
```

---

## 2. Brand Intelligence

```
Industry personality: authoritative, actionable, data-trustworthy
Emotional tone:       confident, calm, efficient — not playful, not cold
Trust level:          high (handles payroll, biometrics, HR data)
Interface density:    medium-dense for admin (tables, panels), low-density for mobile
Visual maturity:      premium, refined — not startup-generic
```

Color behavior: brand teal carries action intent and trust signals. Neutral dark surfaces communicate professionalism. Red only for destructive/flagged states. Amber only for warnings. Green only for verified/success.

Typography personality: geometric-clean for structure (DM Sans headings) + humanist-warm for content (Manrope body) — togther conveying precision with approachability.

---

## 3. UX Architecture

### Navigation Model
```
Sidebar (240px, persistent on desktop, sheet on mobile)
├── Employee Section
│   ├── Dashboard
│   ├── Clock In / Out  ← mobile-first, PWA launch target
│   ├── My Leave
│   ├── Leave History
│   ├── Attendance History
│   └── Face Enrollment  [new Sprint 10]
├── Manager Section
│   ├── Team Attendance
│   └── Leave Approvals
└── HR Admin Section
    ├── Attendance Dashboard
    ├── Trust Review Queue   [new Sprint 4]
    ├── Shift Management     [new Sprint 6]
    ├── Roster Assignment    [new Sprint 6]
    ├── Employees
    ├── Sites                [new Sprint 8]
    ├── Reports & Payroll
    ├── Biometrics
    ├── Settings
    └── Audit Log
```

### Key New Flows
1. **Offline Clock-In**: Widget → queue locally → sync banner → auto-replay on reconnect
2. **Trust Review**: flagged log row → drawer → selfie preview → set state → close
3. **Shift Assignment**: shift list → create/edit shift → roster tab → assign to employee + date range
4. **Payroll Export**: period list → select period → review exceptions → lock → export CSV
5. **Site Ops**: sites list → site card → site dashboard (scoped attendance + biometrics)
6. **Face Enrollment**: capture selfie → confirm → submit → enrolled state

---

## 4. UI Pattern Selection

| Screen | Primary Pattern |
|---|---|
| Trust Review Queue | Data table + slide-in drawer (filter chips: All/Unverified/Flagged/Verified) |
| Shift Management | Card grid + create/edit modal |
| Roster Assignment | Employee list + inline shift selector + date range |
| Sites Management | Card grid + create modal + supervisor sub-list |
| Site Dashboard | Metrics row + scoped attendance table |
| Payroll Periods | List + status badge + lock CTA + export button + exception drawer |
| Offline queue status | Persistent top banner + status badge in nav |
| Face Enrollment | Stepped wizard (3 steps) |
| Network offline | Non-modal warning banner (dismiss on reconnect) |

---

## 5. Layout Pattern Selection

**Admin screens:** Dashboard layout — 240px sidebar + top toolbar + main content area (max-width 1280px)

**Mobile attendance:** Single-column focus layout — centered card, no sidebar, prominent action button

**Drawers:** Right-side slide-in, 420px wide on desktop, full-width on mobile

**Modals:** Centered, max-width 560px, always scrollable content

---

## 6. Layout Intelligence

```
Grid:         12-column, 24px gutter
Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px
Sidebar:      240px fixed, collapses to sheet below lg breakpoint
Content max:  1280px centered
Right drawer: 420px (desktop), full-width (mobile)
Breakpoints:
  sm:  640px
  md:  768px
  lg:  1024px  ← sidebar becomes persistent
  xl:  1280px
  2xl: 1400px

Stacking rules:
- Sidebar collapses → hamburger menu → sheet drawer
- Drawer becomes full-screen modal on mobile
- Tables become single-column card lists below md
- Payroll export button always visible (sticky footer on mobile)
```

---

## 7. Design System Tokens (Implemented)

Source of truth:
- `src/index.css` for CSS custom properties (light + dark)
- `tailwind.config.ts` for Tailwind aliases to those properties

### 7.1 Colors

```css
/* --- Brand (deprecated in docs; see tables below) --- */
--color-brand:          #2FABB9;   /* teal — primary action, trust, focus */
--color-brand-hover:    #1E8F9C;   /* deeper teal on hover */
--color-brand-subtle:   rgba(47, 171, 185, 0.08); /* 8% teal for hover bg, active highlight */

/* --- Trust state semantic colors (implemented) --- */
--color-trust-verified: hsl(158 60% 38%);   /* green */
--color-trust-flagged:  hsl(14 86% 52%);    /* red/orange */
--color-trust-unverified: hsl(38 95% 50%);  /* amber */
--color-trust-supervised: hsl(210 70% 52%); /* blue */

/* --- Surface scale (implemented as light/dark HSL tuples) --- */
--background:           0 0% 98% (light) / 0 0% 7% (dark)
--card:                 0 0% 100% (light) / 0 0% 10% (dark)
--border:               0 0% 90% (light) / 0 0% 18% (dark)
--muted-foreground:     0 0% 46% (light) / 0 0% 55% (dark)

/* --- Status semantic (implemented) --- */
--color-success: hsl(158 60% 38%);
--color-warning: hsl(38 95% 50%);
--color-danger:  hsl(0 72% 52%);
--color-info:    hsl(210 70% 52%);
```

These tokens already exist in `src/index.css` under `:root` and `.dark`.

Brand + semantic colors (source: `src/index.css`):

| Token | Light | Dark |
|---|---|---|
| `--color-brand` | `#2FABB9` | `#2FABB9` |
| `--color-brand-hover` | `#1E8F9C` | `#1E8F9C` |
| `--color-brand-subtle` | `rgba(47, 171, 185, 0.08)` | `rgba(47, 171, 185, 0.08)` |
| `--color-trust-verified` | `hsl(158 60% 38%)` | `hsl(158 55% 48%)` |
| `--color-trust-unverified` | `hsl(38 95% 50%)` | `hsl(38 90% 60%)` |
| `--color-trust-flagged` | `hsl(14 86% 52%)` | `hsl(14 80% 62%)` |
| `--color-trust-supervised` | `hsl(210 70% 52%)` | `hsl(210 65% 62%)` |
| `--color-success` | `hsl(158 60% 38%)` | `hsl(158 55% 48%)` |
| `--color-warning` | `hsl(38 95% 50%)` | `hsl(38 90% 60%)` |
| `--color-danger` | `hsl(0 72% 52%)` | `hsl(0 68% 62%)` |
| `--color-info` | `hsl(210 70% 52%)` | `hsl(210 65% 62%)` |

### Typography Scale

| Token | Font | Size | Weight | Line-height |
|---|---|---|---|---|
| Display | DM Sans | 2.5rem / 40px | 700 | 1.1 |
| Heading 1 | DM Sans | 1.75rem / 28px | 700 | 1.2 |
| Heading 2 | DM Sans | 1.25rem / 20px | 600 | 1.3 |
| Subheading | Manrope | 0.875rem / 14px | 600 | 1.4 |
| Body | Manrope | 0.875rem / 14px | 400 | 1.6 |
| Body SM | Manrope | 0.8125rem / 13px | 400 | 1.5 |
| Caption | Manrope | 0.75rem / 12px | 500 | 1.4 |
| Code | SF Mono | 0.8125rem / 13px | 400 | 1.5 |

### Spacing Scale
`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64px`

### Radius Tokens
```
--radius-sm:  4px   (badges, chips, small inputs)
--radius-md:  8px   (buttons, inputs, table rows)
--radius-lg:  12px  (cards, panels)    ← existing --radius
--radius-xl:  16px  (modals, drawers)
--radius-2xl: 24px  (hero cards, feature blocks)
```

### Elevation Tokens
```
--shadow-card:   0 1px 3px hsl(0 0% 0% / 0.08), 0 1px 2px hsl(0 0% 0% / 0.06)
--shadow-drawer: 0 20px 25px hsl(0 0% 0% / 0.15), 0 8px 10px hsl(0 0% 0% / 0.08)
--shadow-modal:  0 25px 50px hsl(0 0% 0% / 0.25)
--shadow-popover:0 4px 16px hsl(0 0% 0% / 0.12)
```

---

## 8. Creative Direction Exploration

Four directions considered:

**A — Restrained Futuristic (chosen)**
Minimal dark UI, teal accent as the only high-saturation color, generous whitespace in content areas, monoline data tables, subtle frosted glass surfaces. Feels like a tool a serious operations team would trust.

**B — Swiss Modernist**
Grid-heavy, high contrast, editorial typography, bold color blocks. Too loud for HR data density — legibility suffers on dense tables.

**C — Industrial Utility**
High-density tabular layout, dark charcoal surfaces, bordered grids, no radius decorations. Professional but joyless — poor for mobile attendance use cases.

**D — Editorial Technical**
Serif accents, bleed layouts, magazine grid composition. Beautiful on landing pages (already implemented there) but wrong for admin dashboards requiring fast scanning.

**Winner: A — Restrained Futuristic.** Matches the existing app chrome (dark sidebar, teal brand), reads fast at high density, works on mobile, feels premium without visual noise.

---

## 9. Aesthetic Direction

```
Design movement:  Restrained Futuristic
Brand tone:       Precise, trustworthy, operationally serious
Density target:   Medium-dense (admin) / Low-density (mobile attendance)
Surface feeling:  Dark matte ground, subtle border definition, glass highlights on elevated panels
Typography:       DM Sans for structure, Manrope for content — clean geometric + humanist
Color behavior:   Near-monochrome neutrals with teal as the single accent;
                  semantic reds/ambers/greens only for status states, never decorative
Easing:           cubic-bezier(0.23, 1, 0.32, 1) — apple-ease already in tailwind.config.ts
```

---

## 10. Visual Composition Rules

- **Focal anchor**: every screen has one primary CTA in teal; everything else is secondary
- **Hierarchy**: size → weight → color → spacing (in that order of precedence)
- **Table rhythm**: 48px row height, alternating subtle row tints, sticky header
- **Badge anchoring**: trust state badges are always right-aligned in table rows
- **Panel depth**: cards sit 1 elevation level above page background; drawers 2 levels; modals 3 levels
- **Contrast rule**: text on dark backgrounds always `>= hsl(0 0% 85%)` ≥ WCAG AA; links/actions use teal at `>= 4.5:1`
- **Empty states**: centered, icon + heading + body + single primary CTA — no secondary guidance clutter

---

## 11. Component System

### Buttons
| Variant | Background | Text | Hover |
|---|---|---|---|
| Primary | `--color-brand` | white | `--color-brand-hover` |
| Secondary | `hsl(var(--secondary))` | `hsl(var(--secondary-foreground))` | lighten 5% |
| Destructive | `hsl(0 72% 56%)` | white | darken 5% |
| Ghost | transparent | foreground | `--color-brand-subtle` bg |
| Outline | transparent | foreground | secondary bg |

All buttons: height 36px (sm) / 40px (default) / 44px (lg/mobile), radius 8px, Manrope 14px 600.

### Trust State Badges
```tsx
// Usage: <TrustBadge state="verified" /> → renders chip with colored dot + label
states: unverified | supervised | verified | flagged
colors: amber | blue | green | red
style: pill shape, 6px vertical padding, 10px horizontal, 12px font, 500 weight
```

### Shift Chip
```
style: outlined pill, DM Sans 13px, shows shift name + hours range
e.g. "Morning · 8:00–17:00"
```

### Attendance Table Row (admin dashboard)
```
height: 48px
columns: Employee | Date | Clock-In | Clock-Out | Status | Trust | Shift | Actions
status colors: present=green, late=amber, absent=red, half_day=blue
row hover: --color-brand-subtle background, 150ms ease
action menu: ellipsis → "Edit / View / Ask AI / Verify"
```

### Data Table (general pattern)
```
- Filter chips row above table: all tabs are outlined, active tab fills with --secondary
- Search input: left of filter chips
- Table header: sticky, 40px, muted foreground text, 600 weight
- Row: 48px, border-bottom only (no side borders)
- Pagination: bottom-right, "X–Y of Z" + prev/next
- Row selection: checkbox column, bulk action bar appears on selection
```

### Side Drawer
```
width:     420px desktop, 100% mobile
animation: slide-in-right 200ms apple-ease
header:    title (DM Sans 20px 700) + subtitle + close button
body:      scrollable, 24px padding
footer:    sticky, border-top, action buttons right-aligned
```

### Shift Modal (create/edit)
```
width:      560px
sections:   Name → Hours → Work Days (day chips) → Grace Period → Overtime Threshold
day chips:  M T W T F S S — toggle select, teal fill when active
```

### Mobile Clock Widget
```
Full-width card, centered
State machine: not-clocked-in | clocking-in | clocked-in | clocking-out | queued | syncing
CTA button: 100% width, 56px height, teal (clock in) / red (clock out) / amber (queued)
Status line below button: current time / "Queued — will sync on reconnect" / "Syncing..."
Selfie preview: 64×64px circle above CTA, shows captured photo or camera placeholder
```

### Sync Status Banner (offline)
```
position: fixed top, full width, z-index 50
background: amber-950 dark / amber-50 light
text: "You're offline · X event(s) queued for sync"
icon: cloud-off (left) + chevron/close (right)
dismiss: auto when online event fires
```

### Empty State
```
icon: centered, 40px, muted
heading: DM Sans 20px 700, centered
body: Manrope 14px, muted-foreground, centered, max-width 360px
CTA: Primary button, centered, 150ms fade-in delay for entry feel
```

---

## 12. Screen Compositions (pre-code specs)

### Trust Review Queue (`/admin/trust-review`)
```
Layout: standard admin (sidebar + main)
Header: "Trust Review" h1 + "X unreviewed" badge
Filter chips: All | Unverified | Flagged | Verified | Supervised
Table columns: Employee | Date | Time | Selfie (thumbnail 32px circle) | Trust State | Actions
Row actions: "Review" → opens drawer
Drawer: 
  - Selfie full-size (200px × 200px center crop)
  - Employee name, date, clock-in time
  - Current trust state badge
  - Selector: [Verify] [Flag] [Mark Supervised] 
  - Review notes textarea (optional)
  - [Save] primary button
Empty state: green checkmark icon + "All attendance has been reviewed"
```

### Shift Management (`/admin/shifts`)
```
Layout: standard admin tabs (Shift Templates | Roster Assignments | Weekly Off Rules)
Tab 1 — Shift Templates:
  - Add Shift button (top-right, primary)
  - Card grid (3 cols desktop, 1 col mobile)
  - Card: name, start–end time, work days chips, grace badge, active toggle
  - Edit/Delete actions on card hover
  - Create modal: name, start time, end time, day pickers, grace period (minutes), OT threshold
Tab 2 — Roster Assignments:
  - Employee search + department filter
  - Table: Employee | Department | Shift | Effective From | Effective To | Actions
  - Assign CTA opens modal: employee selector, shift dropdown, date range
Tab 3 — Weekly Off Rules:
  - Table: Scope (Employee/Department) | Name | Off Days | Actions
  - Day chips show Sun Mon … Sat (filled = off day)
```

### Payroll Export (`/admin/reports` — Payroll tab)
```
Period selector: dropdown or tabs for month/custom range
Period status banner: "Open" (green outline) or "Locked 🔒" (amber)
Employee rows: name | dept | worked hrs | paid leave | gross pay | exceptions badge
Exception badge: orange "2 exceptions" → click opens exception drawer
Exception drawer: list each exception, resolve/dismiss per row
Action bar (sticky bottom):
  - [Lock Period] (disabled if already locked)
  - [Export CSV] (always enabled)
  - Export triggers download of papaparse-generated CSV
```

### Sites Management (`/admin/sites`)
```
Header: "Sites" h1 + "X active" badge + [Add Site] primary button
Card grid (2–3 cols desktop)
Site card:
  - Name (h2) + address (body, muted)
  - Live headcount pill: "12 clocked in today"
  - Biometrics devices count
  - Supervisors count
  - [View Dashboard] ghost button → /admin/sites/:id
  - [Edit] ghost button
Add Site modal: name, address, timezone selector, geofence toggle (shows map or coord inputs if enabled)
Supervisor sub-list (in site detail): user search → assign → table with remove action
```

### Site Dashboard (`/admin/sites/:id`)
```
Breadcrumb: Sites > [Site Name]
Metrics row (4 cards): Clocked In Today | Late Today | Absent Today | Pending Sync
Attendance table: scoped to site, same columns as admin attendance dashboard
Biometrics panel: device sync status cards (last sync time, record count, status chip)
```

---

## 13. Interaction Design

| Interaction | Timing | Easing | Detail |
|---|---|---|---|
| Page route transition | 150ms | ease-out | fade-up (opacity + 8px Y) |
| Drawer open/close | 200ms | apple-ease | slide from right |
| Modal open | 180ms | apple-ease | scale 0.96→1 + fade |
| Table row hover | 100ms | ease | background tint |
| Trust badge change | 250ms | apple-ease | cross-fade + scale pulse |
| Sync banner appear | 200ms | apple-ease | slide down from top |
| Sync banner dismiss | 150ms | ease-in | slide up + fade |
| Button press | 80ms | ease-in | scale 0.97 |
| Offline clock CTA | instant | — | amber state swap, no transition delay |
| Card hover lift | 200ms | apple-ease | translateY(-2px) + shadow |

All animations respect `prefers-reduced-motion: reduce` (already in index.css via `*` override rule).

---

## 14. Accessibility Requirements

- **Contrast**: all body text ≥ 4.5:1 on dark backgrounds (verified against `hsl(0 0% 55%)` muted threshold)
- **Trust badges**: never rely on color alone — always include text label ("Verified", "Flagged", etc.)
- **Focus states**: existing `focus-visible` outline rule in index.css applies; teal focus ring for interactive elements
- **Drawer**: focus trap on open, `Escape` closes, focus returns to trigger on close
- **Table rows**: row-level keyboard navigation with `aria-selected`, action menu triggered via `Enter`/`Space`
- **Mobile CTA**: minimum 56px height for clock-in button (exceeds 44px minimum)
- **Sync banner**: `role="status"` + `aria-live="polite"` so screen readers announce offline/online transitions
- **Shift day chips**: `role="checkbox"` with aria-label "Monday" etc., keyboard toggleable
- **Selfie capture**: camera feed described with `aria-label="Camera preview for attendance selfie"`

---

## 15. Critique and Refinement

**Issues identified and resolved during this phase:**

1. ❌ Original plan used generic green/red badge colors → ✅ Assigned semantic HSL values anchored to existing dark-mode surface scale for legibility at all zoom levels
2. ❌ Drawer at 480px felt crowded on 1024px viewports → ✅ Reduced to 420px — leaves 584px main content visible
3. ❌ Mobile clock widget originally fullscreen → ✅ Card instead — leaves room for NetworkStatusBanner above and bottom nav below
4. ❌ Payroll table had too many columns (10+) → ✅ Deferred "Deductions" and "Net Pay" to Phase 2; core columns stay at 7
5. ❌ Sites card grid at 3 cols was visually sparse with few sites → ✅ Auto-grid with `minmax(280px, 1fr)` — adapts gracefully from 1 to 3 cols
6. ❌ Shift day chips needed touch target assessment → ✅ 36px minimum height per chip, 8px gap between chips

**Quality bar met:**
- Design language is consistent with and extends the existing BALANCE product brand
- No generic gradient SaaS patterns introduced
- All patterns are drawn from high-signal interaction conventions (table+drawer, wizard, card grid)
- Motion is functional only (state transitions, offline sync feedback)
- Every new screen has a defined empty state
