# Domain Delivery Blueprint — Leaveflow Pro Phase 0

## Status
- Drafted: 2026-03-25
- Version: 0.1.0
- Scope: Command Palette & Design Alignment

## Overview
This blueprint defines the delivery standards and patterns for the Phase 0 implementation slice, focusing on global speed (Command Palette) and visual cohesion (Design Alignment).

## Delivery Patterns

### P1: Global Command Orchestration
- **Pattern**: Centralized role-aware command registry mounted in the authenticated shell (`AppLayout`).
- **Primitive**: Uses `cmdk` wrapped in `src/components/ui/command.tsx`.
- **Shortcut**: `⌘K` / `Ctrl+K` for global access.
- **Validation**: Must filter by user role (`Employee`, `Manager`, `HR Admin`) to prevent privilege exposure in the UI.

### P2: Unified Design Language
- **Iconography**: Standardize on `lucide-react` for all shell and high-visibility landing surfaces.
- **Accents**: Use the primary brand teal (`hsl(var(--primary))`) for active states, CTAs, and decorative elements. Avoid legacy neon/fuchsia accents.
- **Surfaces**: Maintain a high-contrast dark sidebar (`bg-[#171411]`) for the authenticated shell to distinguish from lighter content areas.

## Roadmap

### Phase 0 (Current)
- [x] Global Command Palette integration.
- [x] Role-aware navigation and quick actions.
- [x] Design alignment pass on shell and landing surfaces.

### Phase 1 (Future)
- [ ] Recruitment and Talent Acquisition modules.
- [ ] Performance Reviews and Feedback loops.
- [ ] Expense Management and Reimbursement workflows.

### Phase 2 (Future)
- [ ] Global Payroll and Benefits orchestration.
- [ ] Advanced Compliance and Policy automation.
- [ ] AI-driven Workforce Analytics and Forecasting.

## Verification Standards
- **Lint**: Zero errors on touched files.
- **Type Check**: Clean `tsc` run.
- **Tests**: 100% pass rate for unit and integration tests covering the command palette and touched surfaces.
