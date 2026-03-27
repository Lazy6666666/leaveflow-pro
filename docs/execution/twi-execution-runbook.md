# TWI Execution Runbook

This runbook converts the approved plan into an execution-ready sequence with explicit handoffs, gates, and acceptance checks.

## 1) Global operating rules

- Work in this order: **Convex DB/Schema** → **AI Agent Engine** → **Production deployment checklist**.
- Do not start implementation on any TWI until its acceptance criteria are written in this file and linked to test evidence.
- Every backend change must include:
  - role/authorization verification,
  - observability event updates,
  - rollback notes.

## 2) Workstream A — Convex DB & Schema architecture

### TWI-35 — Schema contract inventory and ownership

**Execution tasks**
1. Create a table-by-table ownership map for all AI/payroll/insights/policy entities.
2. Mark each field as required/optional/deprecated and define source-of-truth module.
3. Record which frontend pages consume each contract.

**Acceptance criteria**
- Contract map is complete for: `profiles`, `policyDocuments`, payroll/insights-dependent tables.
- Every table has an owner module and auth boundary documented.
- No undocumented cross-module writes remain.

**Validation**
- Static review against `convex/schema.ts` + domain modules.
- Peer signoff from one backend reviewer.

---

### TWI-36 — Index and hot-path query hardening

**Execution tasks**
1. Enumerate top read paths used by dashboards, reports, and assistant tools.
2. Verify index coverage for each query filter/sort path.
3. Add/adjust indexes where required and document query plan intent.

**Acceptance criteria**
- All top read paths map to explicit index strategy.
- No hot-path query relies on full scan in production-facing flows.

**Validation**
- Query-path checklist completed.
- Staging verification on representative data.

---

### TWI-37 — Migration/backfill safety pack

**Execution tasks**
1. Define forward-only migration sequence per changed table.
2. Add backfill logic and idempotency notes.
3. Document rollback constraints for schema-involved deploys.

**Acceptance criteria**
- Migration order is explicit and reproducible.
- Backfill can be rerun safely.
- Rollback procedure calls out compatibility boundaries.

**Validation**
- Dry-run migration checklist on staging snapshot.
- Evidence attached in release notes.

---

### TWI-43 — Data authorization and tenancy boundary enforcement

**Execution tasks**
1. Audit mutations/queries for server-side role checks.
2. Add explicit ownership checks for user-scoped records.
3. Reject unauthorized access with structured errors.

**Acceptance criteria**
- No privileged data returned to non-privileged roles.
- All sensitive mutations fail closed when auth context is missing.

**Validation**
- Role matrix tests for employee/manager/hr_admin.

---

### TWI-44 — Data contract docs + generated type alignment

**Execution tasks**
1. Regenerate/update typed contracts only after schema is stable.
2. Verify frontend consumers compile with updated contract surface.
3. Publish contract change log for dependent modules.

**Acceptance criteria**
- Contract/version notes added for all changed entities.
- No unresolved type mismatches across Convex/UI boundary.

**Validation**
- Typecheck and targeted module verification.

## 3) Workstream B — AI Agent Engine module

### TWI-38 — Tool contract and intent routing lock

**Execution tasks**
1. Freeze tool names, arguments, and role eligibility matrix.
2. Align prompt instructions and tool schema definitions.
3. Ensure unsupported tools return structured, non-crashing responses.

**Acceptance criteria**
- Tool contract document signed off.
- Intent-to-tool mapping has no ambiguous route for supported intents.

**Validation**
- Unit tests for parser + intent resolution + unsupported tool behavior.

---

### TWI-39 — Resilience and fallback hardening

**Execution tasks**
1. Normalize handling for missing key, transport errors, HTTP failures, parse errors, and tool loop exhaustion.
2. Ensure every failure mode produces a user-safe response.
3. Preserve deterministic fallback for handled intents.

**Acceptance criteria**
- All known failure classes are covered in code and tests.
- No unhandled exceptions leak to UI for assistant request path.

**Validation**
- Failure-injection tests for each error class.

---

### TWI-41 — Observability and incident traceability

**Execution tasks**
1. Add/standardize telemetry for model path, tool path, fallback path.
2. Record incident fingerprints with actionable metadata.
3. Define threshold-based operational alerts.

**Acceptance criteria**
- Every assistant response can be categorized (model/tool/fallback).
- Incident logs include enough context for operator triage.

**Validation**
- Staging run demonstrating trace visibility.

---

### TWI-42 — AI regression and role-safety test suite

**Execution tasks**
1. Expand tests for role-restricted tools and denied access responses.
2. Add regressions for markdown/table output path.
3. Add staging smoke checklist entries for AI-specific flows.

**Acceptance criteria**
- Role-safety regressions pass for all supported roles.
- AI smoke path passes in staging before release.

**Validation**
- Focused AI test command suite + staging smoke evidence.

## 4) Workstream C — Production deployment checklist

### TWI-46 — Preflight release gates

**Execution tasks**
1. Standardize a single preflight command sequence.
2. Require env checks, build, and artifact verification before deploy.
3. Capture gate outcomes in release record.

**Acceptance criteria**
- Deploy cannot proceed without passing preflight gates.
- Preflight output is stored with release evidence.

**Validation**
- Dry-run release with preflight and recorded outputs.

---

### TWI-47 — Post-deploy verification + rollback drill

**Execution tasks**
1. Execute staging/prod smoke checks by role and integration.
2. Rehearse one frontend rollback and one Convex rollback case.
3. Assign owner matrix (deploy/rollback/webhook/smoke).

**Acceptance criteria**
- Post-deploy checklist completed with named owners.
- Rollback drills executed and timed.

**Validation**
- Signed release checklist + drill results.
- Run automated smoke gate command:
  - `npm run release:staging-smoke -- --base-url https://<branch>.<project>.pages.dev`

## 5) Cross-stream dependency gates

- **Gate 1:** TWI-35/36/37 complete before TWI-38+ start.
- **Gate 2:** TWI-43/44 complete before AI role-safety signoff.
- **Gate 3:** TWI-46 preflight must pass before any production deploy containing these changes.
- **Gate 4:** TWI-47 smoke + rollback drill must be complete for closure.

## 6) Blockers requiring clarification before coding the corresponding ticket

- Exact acceptance criteria and out-of-scope notes for each TWI ticket in Linear.
- Required SLO targets for AI latency/failure rate.
- Whether moderation policy enforcement is in scope for this batch.
- Whether release gating is mandatory CI-blocking or manual approval.
