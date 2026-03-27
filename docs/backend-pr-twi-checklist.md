# Backend PR/TWI Mandatory Checklist Template

> **Scope:** Required for every backend PR and all TWIs from **TWI-35** through **TWI-44**.
> **Signoff rule:** Signoff is blocked until every required field and checkbox in this checklist is completed.

## 1) Authorization verification

- [ ] Affected query list documented.
- [ ] Affected mutation list documented.
- [ ] Role matrix impact reviewed and updated.

### Affected queries

| Query | Access before | Access after | Notes |
|---|---|---|---|
| _fill-in_ | _fill-in_ | _fill-in_ | _fill-in_ |

### Affected mutations

| Mutation | Access before | Access after | Notes |
|---|---|---|---|
| _fill-in_ | _fill-in_ | _fill-in_ | _fill-in_ |

### Role matrix impact

| Role | Impacted? (Y/N) | Change summary | Reviewer |
|---|---|---|---|
| Employee | _fill-in_ | _fill-in_ | _fill-in_ |
| Manager | _fill-in_ | _fill-in_ | _fill-in_ |
| HR/Admin | _fill-in_ | _fill-in_ | _fill-in_ |

---

## 2) Observability updates

- [ ] Event names added/changed are listed.
- [ ] Event fields added/changed are listed.
- [ ] Existing event coverage verified for unchanged paths.

### Events and fields

| Event name | Added/Updated/Verified | Fields (added/changed/verified) | Notes |
|---|---|---|---|
| _fill-in_ | _fill-in_ | _fill-in_ | _fill-in_ |

---

## 3) Rollback notes

- [ ] Compatibility assumptions documented.
- [ ] Safe rollback boundary defined.
- [ ] Data/backfill implications captured.

### Rollback plan

| Item | Details |
|---|---|
| Compatibility assumptions | _fill-in_ |
| Safe rollback boundary | _fill-in_ |
| Data migration/backfill impact | _fill-in_ |
| Rollback validation steps | _fill-in_ |

---

## 4) Reviewer confirmation (required)

| Checklist area | Reviewer | Date (YYYY-MM-DD) | Confirmation |
|---|---|---|---|
| Authorization verification | _fill-in_ | _fill-in_ | [ ] Confirmed |
| Observability updates | _fill-in_ | _fill-in_ | [ ] Confirmed |
| Rollback notes | _fill-in_ | _fill-in_ | [ ] Confirmed |

---

## 5) Signoff gate (must be complete)

- [ ] Sections 1-4 are fully completed.
- [ ] No `_fill-in_` placeholders remain.
- [ ] Reviewer confirmations are checked.
- [ ] TWI and PR are **not** signed off until all items above are complete.
