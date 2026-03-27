# Assistant Failure-Response Contract

This contract defines the minimum required behavior whenever assistant requests fail in frontend, backend, provider, or tool-execution paths.

## 1) Structured Error Shape (Required)

Every non-success assistant response **must** include an `error` object with this schema:

```ts
interface AssistantFailure {
  code: string;
  category: "auth" | "transport" | "http" | "parse" | "tooling" | "unknown";
  userMessage: string;
  retriable: boolean;
  incidentFingerprint: string;
}
```

### Field rules

- `code`: stable machine-readable code (example: `MISSING_API_KEY`, `HTTP_429`, `TOOL_LOOP_EXHAUSTED`).
- `category`: coarse class used for analytics buckets and UI routing.
- `userMessage`: user-safe message with no internal secrets, stack traces, provider payloads, or env names.
- `retriable`: deterministic retry signal for UX and automation.
- `incidentFingerprint`: deterministic fingerprint generated from normalized failure dimensions (`category`, `code`, `intentClass`, route/tool context, and sanitized status metadata).

## 2) Failure-Class Mapping (Required)

| Failure class | `code` | `category` | `retriable` | Minimum `userMessage` behavior |
|---|---|---|---|---|
| Missing key/config | `MISSING_API_KEY` (or `MISSING_<KEY>`) | `auth` | `false` | Explain service is unavailable now and that admins should check configuration; do not expose key names to end users. |
| Transport/network timeout/DNS/reset | `TRANSPORT_ERROR` | `transport` | `true` | Ask user to retry; preserve deterministic fallback response by intent class. |
| HTTP non-2xx from provider | `HTTP_<STATUS>` (e.g. `HTTP_429`, `HTTP_503`) | `http` | `true` for `429/5xx`, otherwise `false` | Give user-safe failure summary; no raw provider body in user-visible text. |
| Parse/shape/JSON validation failure | `PARSE_ERROR` | `parse` | `true` | Report temporary response-format issue and continue with deterministic fallback. |
| Tool-loop exhaustion/max tool calls reached | `TOOL_LOOP_EXHAUSTED` | `tooling` | `false` | Explain the request could not be completed automatically and return intent-safe fallback guidance. |

### Mapping invariants

- `code`, `category`, and `retriable` are contractually stable for each failure class.
- Provider-specific details may be logged for operators, but must stay out of `userMessage`.
- `incidentFingerprint` must stay stable for equivalent failures to enable deduplication and rate monitoring.

## 3) Deterministic Fallback by Intent Class

Fallback text must be deterministic for each intent class and independent from provider wording.

| Intent class | Required fallback behavior |
|---|---|
| `attendance` | Return attendance-focused operational guidance and next action checklist. |
| `leave` | Return leave-policy and request-status guidance with specific self-serve steps. |
| `payroll` | Return payroll exception triage steps and escalation path. |
| `policy` | Return policy lookup guidance and suggest narrowing terms/date range. |
| `general` / unknown | Return concise safe fallback plus prompt to rephrase intent more specifically. |

### Fallback invariants

- Same `intentClass` + same normalized failure class => same fallback template.
- Fallback content must never leak stack traces, endpoint URLs, auth headers, or raw provider payload.
- Fallback must be returned even when telemetry/logging fails.

## 4) UI Handling Expectations

### Must be shown

- `userMessage`.
- Optional retry action only when `retriable === true`.
- Stable, non-sensitive incident reference derived from `incidentFingerprint` (for support handoff).
- Fallback-reason indicator (for example: “Using fallback response.”).

### Must be hidden from end users

- Stack traces and raw exception strings.
- Provider response payloads and headers.
- Secrets/env variables/internal endpoint paths.
- Internal-only diagnostic metadata beyond the support-safe incident reference.

### UI behavior rules

- Rendering failures must not crash the chat thread.
- Failure state must preserve conversation context and input draft where practical.
- Retry UI must be disabled for non-retriable failures.

## 5) Required Test Assertions

## Failure-injection suite (required assertions)

For each failure class (missing key, transport, HTTP, parse, tool-loop exhaustion), assert:

1. Response contains `error.code`, `error.category`, `error.userMessage`, `error.retriable`, `error.incidentFingerprint`.
2. `code/category/retriable` match the mapping table exactly.
3. `userMessage` is sanitized (no stack trace, secret-like tokens, provider raw payload fragments).
4. Deterministic fallback content matches the expected template for the request's `intentClass`.
5. `incidentFingerprint` is deterministic across repeated equivalent failures.
6. Telemetry/logging failures do not prevent fallback delivery.

## Staging smoke checks (required assertions)

At minimum, staging smoke validation must confirm:

1. Missing-key path returns structured error + deterministic fallback, with no leaked key names in end-user text.
2. Simulated transport failure returns retriable structured error + retry affordance in UI.
3. Simulated provider `429` and `503` return retriable structured errors and fallback output.
4. Simulated parse failure returns `PARSE_ERROR` and deterministic fallback.
5. Forced tool-loop exhaustion returns `TOOL_LOOP_EXHAUSTED`, non-retriable UI state, and safe fallback guidance.
6. UI displays only safe user text + incident reference and hides raw diagnostics.

## Release gate

A release is not complete unless failure-injection tests and staging smoke checks both pass against this contract.
