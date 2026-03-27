## Summary

<!-- Describe backend change, impacted services/modules, and migration risk. -->

## Linked TWI(s)

<!-- Example: TWI-35 -->

## Mandatory Backend PR/TWI Checklist

> Complete the canonical checklist: `docs/backend-pr-twi-checklist.md`.
> Signoff is blocked until every required field is completed.

### 1) Authorization verification

- [ ] Affected query list included.
- [ ] Affected mutation list included.
- [ ] Role matrix impact included.

### 2) Observability updates

- [ ] Event names added/changed/verified documented.
- [ ] Event fields added/changed/verified documented.

### 3) Rollback notes

- [ ] Compatibility assumptions documented.
- [ ] Safe rollback boundary documented.

### 4) Reviewer confirmation

- [ ] Authorization reviewer named and confirmed.
- [ ] Observability reviewer named and confirmed.
- [ ] Rollback reviewer named and confirmed.

### 5) Signoff gate

- [ ] I confirm this PR/TWI is **not signed off** until all checklist items above are fully completed.
