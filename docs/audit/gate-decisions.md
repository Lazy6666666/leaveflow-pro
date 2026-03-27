# Gate Decision Audit Trail

Use this ledger to record formal pass/fail decisions for Gate 1-4. Every gate decision entry must include approver roles, named approvers, TWI completion status, evidence IDs, timestamp (UTC), decision outcome, and override metadata if applicable.

## Decision Entry Template

| Field | Required | Description |
| --- | --- | --- |
| gate_id | Yes | `GATE-1`, `GATE-2`, `GATE-3`, or `GATE-4` |
| release_id | Yes | Release or deployment identifier |
| decision | Yes | `PASS`, `FAIL`, or `OVERRIDE-PASS` |
| decided_at_utc | Yes | ISO-8601 timestamp |
| approver_roles | Yes | Required roles for the gate |
| approvers | Yes | Individual approver names/handles |
| twi_ids | Yes | Completed TWI IDs required by that gate |
| evidence_ids | Yes | Evidence IDs linked to each TWI |
| failure_action | Yes | Blocking behavior triggered on fail |
| override_justification | Conditional | Required when `decision=OVERRIDE-PASS` |
| override_expiry_utc | Conditional | Required when `decision=OVERRIDE-PASS` |

## Gate Decisions

| gate_id | release_id | decision | decided_at_utc | approver_roles | approvers | twi_ids | evidence_ids | failure_action | override_justification | override_expiry_utc |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _N/A_ | _N/A_ |
