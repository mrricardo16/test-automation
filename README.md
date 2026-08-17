# Agent-Driven Test Automation

## Project goal

This repository is an Agent-driven automation-testing workspace. Its required flow is:

    Requirement / design / flow
    ↓
    Test Case
    ↓
    Automation Classification
    ↓
    API / Web / Avalonia
    ↓
    Execution
    ↓
    PASS / FAIL / ERROR / BLOCKED / MANUAL / SKIPPED
    ↓
    Report

Formal automation starts with a TestCase record and keeps the TestCaseId linked to the executable test.

## Current phase

Implemented:

- Pre-install environment scan
- Project-local Playwright Web foundation
- Chromium browser environment test
- TestCase structure and TestCaseId mapping
- Execution status convention
- Agent repository rules
- Environment and initialization reports
- Project-local npm and Playwright browser mirror configuration
- Independent Avalonia Headless + xUnit fixture (`TC-AVA-ENV-001`)
- Phase 2B / Phase 2.5 real Avalonia project read-only testability assessment

Deferred or not implemented:

- Avalonia Appium E2E
- Executed real-project Headless test; current candidate is assessed but blocked from execution
- API automation
- CI/CD
- Automatic requirement parsing
- Automatic test-case generation
- Result aggregation

Avalonia Phase 2 uses an independent code-only Headless fixture first. Phase 2B / Phase 2.5 is reserved for later real Avalonia project Headless integration. Appium remains uninstalled and out of scope for the current phase.

## Phase 2B / Phase 2.5 assessment

The real project was inspected read-only from `D:\HZ_RSS40\03_trunk\src_m_logclient`, with runtime evidence from `E:\logclient\logclient20260812\net8.0`.

Current conclusion:

- Pure analysis state, filtering, parsing, projection, and aggregation are suitable for `AUTO_UNIT`.
- AnalysisView and ReplayView are potential `AUTO_HEADLESS_WITH_MOCK` targets after a version-matched Avalonia 11.3.14 harness and test-owned external data/storage doubles exist.
- MainWindow/App startup is currently `BLOCKED` for direct integration because the real project is Avalonia 11.3.14 while the independent fixture is Avalonia 12.1.0, and a ProjectReference build could write into the read-only source project.
- Native file pickers, dialogs, shell opening, and OS window behavior are `NEEDS_APPIUM`; map/canvas visual acceptance is currently `MANUAL`.
- No real-project Headless test has been created or executed. The first business candidate is `TC-AVA-LOG-001`, classified `AUTO_UNIT` but currently `BLOCKED` for safe assembly execution.

See `reports/real-avalonia-automation-assessment.md` and `reports/real-avalonia-phase2b-report.md` for evidence and the full matrix.

## Directory guide

- docs/requirements: requirement source and analysis
- docs/designs: test and system design documents
- docs/flows: user and test flows
- test-cases: TestCase source records
- tests/web: Playwright Web tests
- tests/api: reserved API automation boundary
- tests/avalonia/headless: independent Avalonia Headless fixture
- tests/avalonia/real-project: reserved for a future version-matched real-project test harness; not created in this assessment
- tests/avalonia/e2e: reserved Phase 2B / Phase 2.5 real-project boundary
- tests/manual: manual-only test records
- config: future non-secret configuration templates
- scripts: repeatable local setup helpers
- reports: committed audit reports and the generated HTML report location
- artifacts: ignored screenshots, traces, and test results

## Commands

Run the Web environment test:

    npm test

Equivalent command:

    npx playwright test

Reinstall project dependencies:

    npm ci

Run the Avalonia Headless environment test:

    dotnet test tests/avalonia/headless/AutomatedTesting.Avalonia.Headless.csproj

Install Chromium through the configured domestic mirror:

    .\scripts\install-playwright-browser.ps1

The script uses the process-scoped PLAYWRIGHT_DOWNLOAD_HOST value
https://cdn.npmmirror.com/binaries/playwright. It does not change system-level
proxy settings or global npm configuration.

## Recovery

    npm ci
    .\scripts\install-playwright-browser.ps1
    npx playwright test

Do not commit node_modules, browser binaries, generated reports, screenshots, traces, or secrets.
