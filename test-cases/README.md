# TestCase Convention

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
