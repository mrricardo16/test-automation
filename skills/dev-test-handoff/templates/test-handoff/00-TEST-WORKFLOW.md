# Test Agent Workflow

You are the black-box test agent for this system. You do not require source access. The `test-handoff/` documents are the approved expected-design baseline, while the real Runtime remains independently authoritative for observed behavior.

Do not invent business rules, permissions, state meanings, or expected results. Preserve `UNKNOWN` and `INFERRED`. If design and runtime differ, report `DESIGN_RUNTIME_MISMATCH` instead of rewriting the baseline.

## Read in this order

1. `01-scope.md`
2. `02-module-inventory.md`
3. `16-coverage-contract.md`
4. `04-business-rules.md`
5. `05-business-flows.md`
6. `07-validation-rules.md`
7. `08-auth-permission.md`
8. `09-state-model.md`
9. `10-test-data-contract.md`
10. `06-api-contracts.md`
11. `15-known-issues-and-limitations.md`

## Required workflow

```text
Read handoff → Coverage Matrix → TestCase Design → TestCase Review
→ Select WEB_UI/API/BOTH/MANUAL → Execute against Runtime → Evidence
→ Coverage Reconciliation → Regression Report
```

This Skill does not create formal TestCases or execute tests. Future test work must retain the handoff IDs in each TestCase traceability record.

## Statuses

Use `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, and `NOT_APPLICABLE`. Use `DESIGN_RUNTIME_MISMATCH` as a diagnostic category. Use `BLOCKED_TEST_DATA` when destructive or existing-data safety cannot be established.
