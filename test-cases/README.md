# TestCase Convention

## Canonical TestCase-first contract

Every formal test starts with a stable TestCase record before automation code is written. The canonical fields and `ExpectedBasis` vocabulary are defined in [`contracts/testcase-contract.md`](../contracts/testcase-contract.md) and [`contracts/schemas/testcase.schema.json`](../contracts/schemas/testcase.schema.json).

- `TestCaseId` is unique and remains linked through the executable test, `ExecutionStatus`, `ApplicabilityStatus`, `CoverageStatus`, evidence, and report.
- Canonical execution statuses are `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, and `SKIPPED`. `NOT_APPLICABLE` belongs to applicability or coverage, not execution.
- `ExpectedBasis` is `REQUIREMENT`, `DESIGN`, `APPROVED_BASELINE`, `HANDOFF_BASELINE`, `CODE_BEHAVIOR`, or `UNKNOWN`. Runtime observations belong to Actual/Observation Evidence.
- Legacy fields such as `Module`, `RequirementSource`, and old `Status` values remain readable through `LegacyFieldAdapter`; historical TestCases and IDs are not renumbered or batch-rewritten.

The platform TestCase `TC-PLATFORM-08-GOV-001` verifies that active Skill governance stays aligned with these contracts.

Every formal test starts with a TestCase record before automation code is written.

## Required fields

- TestCaseId: unique stable identifier, for example TC-WEB-ENV-001
- Module: API, WEB, AVALONIA, or MANUAL
- Title: human-readable purpose
- Priority: P0, P1, P2, or P3
- TestType: Environment, Functional, API, UI, Headless, Desktop E2E, or Manual
- Preconditions: required setup
- Steps: ordered actions
- ExpectedResult: observable expected outcome
- AutomationType: AUTO, AUTO_PARTIAL, or MANUAL
- AutomationFramework: framework used or None
- RequirementSource: source requirement, design, issue, or phase
- Notes: evidence, limitations, and mapping notes

## Required workflow

    Requirement / design / flow
    ↓
    Test Case
    ↓
    Automation classification
    ↓
    Test script mapped by TestCaseId
    ↓
    Real execution
    ↓
    Report

## Automation types

- AUTO: reliably automated end to end.
- AUTO_PARTIAL: part of the flow is automated and the remaining part is explicitly documented.
- MANUAL: reliable automation is unsuitable and a person must execute it.

## Execution statuses

- PASS: execution completed and actual behavior matched the expectation.
- FAIL: execution completed but actual behavior did not match.
- ERROR: framework, script, browser, locator, or environment error stopped execution.
- BLOCKED: a prerequisite was unavailable before execution could begin.
- MANUAL: the test is intentionally performed by a person.
- SKIPPED: this run intentionally did not execute the test.
