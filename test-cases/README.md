# TestCase Convention

## Canonical TestCase-first contract

Every formal test starts with a stable TestCase record before automation code is written. New and substantially redesigned cases follow [`contracts/testcase-generation-standard.md`](../contracts/testcase-generation-standard.md), [`contracts/composite-testcase-standard.md`](../contracts/composite-testcase-standard.md), [`contracts/testcase-contract.md`](../contracts/testcase-contract.md), and [`contracts/schemas/testcase.schema.json`](../contracts/schemas/testcase.schema.json).

- `TestCaseId` is unique and remains linked through the executable test, `ExecutionStatus`, `ApplicabilityStatus`, `CoverageStatus`, evidence, and report.
- Canonical execution statuses are `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, and `SKIPPED`. `NOT_APPLICABLE` belongs to applicability or coverage, not execution.
- `ExpectedBasis` is `REQUIREMENT`, `DESIGN`, `APPROVED_BASELINE`, `HANDOFF_BASELINE`, `CODE_BEHAVIOR`, or `UNKNOWN`. Runtime observations belong to Actual/Observation Evidence.
- Legacy fields such as `Module`, `RequirementSource`, and old `Status` values remain readable through `LegacyFieldAdapter`; historical TestCases and IDs are not renumbered or batch-rewritten.
- `ScenarioSuite` aggregates coverage and lifecycle but has no `ExecutionStatus`; see [`scenario-suite.schema.json`](../contracts/schemas/scenario-suite.schema.json).
- Missing authoritative Expected creates an `ExpectationGap`; see [`expectation-gap.schema.json`](../contracts/schemas/expectation-gap.schema.json). Runtime Observation remains Actual/Evidence and cannot supply Expected.

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

## V2 generation fields

- `CaseKind`: `ATOMIC` or `COMPOSITE`.
- `Objective` and `PrimaryAssertion`: exactly one primary objective and assertion per TestCaseId.
- `LifecycleStatus`, `ReviewGateStatus`, `RiskLevel`, `SideEffects`, `SideEffectScope`, `Reversibility`, `DataOwnership`, and `InteractionMode` control execution eligibility.
- `AutomationEligibility`: `AUTO_ALLOWED`, `MANUAL_REQUIRED`, or `NOT_EXECUTABLE`.
- A Composite additionally records `InitialState`, `Preconditions`, `TestData`, `ExpectedPerStep`, `IntermediateAssertions`, `StateTransitions`, `PostConditions`, `CrossStepInvariants`, `Cleanup`, and `CleanupVerification`.

Independently executable, assertable, and evidence-capable scenarios receive independent TestCaseIds. Do not create Mega Cases. Equivalent data variants may remain one parameterized case when they preserve the same Objective and PrimaryAssertion.

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

For new V2 cases, `AutomationEligibility=AUTO_ALLOWED` is strictly unattended. It cannot pause for confirmation, file selection, CAPTCHA, visual judgment, or a MANUAL queue. Split mixed flows into separate AUTO and MANUAL TestCases and aggregate them with a ScenarioSuite. Historical `AUTO_PARTIAL` remains readable but is not a V2 routing choice.

## Execution statuses

- PASS: execution completed and actual behavior matched the expectation.
- FAIL: execution completed but actual behavior did not match.
- ERROR: framework, script, browser, locator, or environment error stopped execution.
- BLOCKED: a prerequisite was unavailable before execution could begin.
- MANUAL: the test is intentionally performed by a person.
- SKIPPED: this run intentionally did not execute the test.
