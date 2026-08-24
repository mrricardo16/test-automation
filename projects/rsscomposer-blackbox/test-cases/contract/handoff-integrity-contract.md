# Handoff integrity contract TestCases

These are platform contract tests only. They do not execute RSS Composer business behavior, login, API/CRUD, Runtime Regression, or PLATFORM-09.

| TestCaseId | Latest execution status | Behavior | Expected result |
|---|---|---|---|
| TC-PLATFORM-HANDOFF-HASH-001 | PASS | Producer and consumer calculate the same unchanged package | Identical V1 hash and `PASS` |
| TC-PLATFORM-HANDOFF-HASH-002 | PASS | One protected file byte changes | Consumer returns `FAIL` |
| TC-PLATFORM-HANDOFF-HASH-003 | PASS | An excluded envelope file changes | Calculated V1 hash is unchanged |
| TC-PLATFORM-HANDOFF-HASH-004 | PASS | Relative input contains Windows separators | Canonical path uses `/` and hash is platform-stable |
| TC-PLATFORM-HANDOFF-HASH-005 | PASS | Protected files are created in different order | Canonical manifest and V1 hash are equal |
| TC-PLATFORM-HANDOFF-HASH-006 | PASS | Protected text changes from CRLF to LF | Raw-byte hash changes and consumer returns `FAIL` |
| TC-PLATFORM-HANDOFF-HASH-007 | PASS | Integrity envelope has no `ContractVersion` | Consumer returns legacy `BLOCKED`, not `FAIL` or `PASS` |
| TC-PLATFORM-HANDOFF-HASH-008 | PASS | Path case differs | Canonical path preserves case and resulting manifest differs |
| TC-PLATFORM-HANDOFF-HASH-009 | PASS | A UTF-8 BOM is added to a protected file | Raw-byte hash changes and consumer returns `FAIL` |

All fixtures are created in OS temporary directories and removed by the test process. Test names must include the exact `TestCaseId` above.
