# Test Automation Workspace Initialization Design

**Date:** 2026-08-17

**Goal:** Build a minimal, independently runnable Windows automation-testing workspace with Playwright Web infrastructure, TestCase-first conventions, execution-state reporting, and a private GitHub repository on `main`.

## Scope

This phase includes:

- Reuse of the existing Git, Node.js/npm, .NET SDK, and authenticated GitHub CLI installation.
- A new project at `E:\automated-testing`.
- Project-local `@playwright/test` and the Chromium browser required by the environment test.
- A minimal browser-startup test at `tests\web\environment.spec.ts`.
- TestCase metadata and the statuses `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, and `SKIPPED`.
- Repository rules, README guidance, Playwright configuration, environment and initialization reports.
- Local Git initialization and a private remote repository `mrricardo16/test-automation`.

This phase explicitly excludes Avalonia Appium, Avalonia Headless implementation, API automation, CI/CD, automatic requirement parsing, and result aggregation. The `tests\avalonia` directory will contain only a scope placeholder describing the two planned follow-up stages: Avalonia Headless first, then a small Appium desktop E2E set.

## Alternatives Considered

### Option A: Minimal Playwright-only workspace (selected)

Use Node.js, TypeScript, Playwright Test, and Chromium only. This has the smallest dependency and operational surface, directly validates the requested Web automation foundation, and leaves later API/Avalonia decisions open.

### Option B: Add API and reporting frameworks now

This would establish more shared infrastructure immediately, but it expands the current scope, increases dependency and maintenance cost, and makes it harder to distinguish environment readiness from future product-test readiness.

### Option C: Add Appium/Avalonia scaffolding now

This would predefine desktop automation choices before the Headless phase is understood. It violates the current boundary and risks installing tools that are intentionally deferred.

Option A is selected.

## Architecture

The workspace is organized by test target and workflow support:

- `tests\web`: Playwright Web tests; the first test is environment-only and uses `about:blank`.
- `tests\api`, `tests\avalonia`, and `tests\manual`: reserved boundaries for later test types. Only explanatory placeholders are created for currently empty areas.
- `test-cases`: source-of-truth TestCase records. Every formal automated test must have a unique `TestCaseId` and map that ID to its script.
- `config`: future environment and non-secret configuration templates.
- `reports`: committed environment and initialization reports; generated HTML reports are written here but ignored unless explicitly selected for publication.
- `artifacts`: screenshots, traces, videos, and other run outputs; ignored by Git.
- `docs\requirements`, `docs\designs`, and `docs\flows`: requirement-to-test design material.

`playwright.config.ts` is the single Web test runner configuration. It targets `tests\web`, uses Chromium, writes the HTML report under `reports\playwright-report`, and keeps failure screenshots and traces under the Playwright result path inside the ignored artifact boundary.

## TestCase-first Flow

The required workflow is:

```text
Requirement / design / flow
        ↓
TestCase record
        ↓
Automation classification: AUTO / AUTO_PARTIAL / MANUAL
        ↓
Automation script mapped by TestCaseId
        ↓
Real execution
        ↓
Status and evidence report
```

The initial TestCase is `TC-WEB-ENV-001` with `AutomationType=AUTO`, `TestType=Environment`, `AutomationFramework=Playwright`, and `RequirementSource=Phase 1 initialization request`. The test title and source comment will carry the same ID so the record and implementation remain traceable.

## Status and Error Handling

- `PASS`: execution completed and the observed result matched the expectation.
- `FAIL`: execution completed but the observed behavior did not match.
- `ERROR`: execution could not complete because of a framework, script, browser, locator, or environment error.
- `BLOCKED`: a required prerequisite was unavailable, so execution could not reasonably begin.
- `MANUAL`: the test is intentionally not automated because reliable automation is unsuitable.
- `SKIPPED`: this run intentionally did not execute the test.

The initialization test must not suppress failures with skipped tests or deleted assertions. Playwright will retain failure evidence through screenshots and traces according to configuration. Reports will distinguish environment/framework errors from product behavior failures; this phase has no product system under test.

## Environment and Installation Policy

The recorded scan found usable existing installations of Git `2.53.0`, Node.js `24.15.0`, npm `11.12.1`, .NET SDK `10.0.302`, and GitHub CLI `2.93.0`. GitHub CLI is authenticated as `mrricardo16`. The target project did not exist, global `@playwright/test` was absent, and the local Playwright browser cache was absent.

The implementation will reuse all existing tools without upgrading or reinstalling them. It will install only the project-local `@playwright/test` package and the Playwright Chromium browser. `playwright install-deps` is not part of this Windows phase.

## Verification and Delivery

Verification must include:

1. UTF-8 validation and inspection of all Chinese Markdown/text content.
2. `npm ci` from the committed lockfile.
3. `npx playwright --version`.
4. `npx playwright test` with the environment test passing.
5. `git diff --cached --check`, `git status`, and a tracked-file safety check for secrets, `.env`, browser binaries, and oversized files.
6. A local commit on `main`.
7. Creation or connection of the private GitHub repository without force-pushing or overwriting an existing remote.
8. Final verification of `origin`, `main`, remote synchronization, the GitHub repository, and a clean working tree.

The committed reports will state exactly which tools were reused, which dependencies were added by this task, what verification actually passed, and what remains for API automation, Avalonia Headless, Avalonia Appium E2E, test-case generation, aggregation, and CI.

