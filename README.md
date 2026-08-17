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
- Phase 2C Avalonia 11.3.14 real-project Harness with executed runtime-DLL unit and bounded real-view Headless smoke
- Phase 3A real Avalonia business Headless coverage for AnalysisView and ReplayView using the compiled runtime DLL
- Phase 3B real HZ.LogClient.exe Appium Windows minimum-loop evaluation; environment and business Cases are currently BLOCKED by missing WinAppDriver and approved test data

Deferred or not implemented:

- Avalonia Appium E2E
- Full real-project UI workflow automation with storage/dialog/export doubles
- API automation
- CI/CD
- Automatic requirement parsing
- Automatic test-case generation
- Result aggregation

Avalonia Phase 2 uses an independent code-only Headless fixture first. Phase 2B / Phase 2.5 is reserved for later real Avalonia project Headless integration. Phase 3B is now separately evaluated in the Appium report below.

## Phase 2B / Phase 2.5 assessment

The real project was inspected read-only from `D:\HZ_RSS40\03_trunk\src_m_logclient`, with runtime evidence from `E:\logclient\logclient20260812\net8.0`.

Current conclusion:

- Pure analysis state, filtering, parsing, projection, and aggregation are suitable for `AUTO_UNIT`.
- AnalysisView and ReplayView are potential `AUTO_HEADLESS_WITH_MOCK` targets after a version-matched Avalonia 11.3.14 harness and test-owned external data/storage doubles exist.
- MainWindow/App startup is currently `BLOCKED` for direct integration because the real project is Avalonia 11.3.14 while the independent fixture is Avalonia 12.1.0, and a ProjectReference build could write into the read-only source project.
- Native file pickers, dialogs, shell opening, and OS window behavior are `NEEDS_APPIUM`; map/canvas visual acceptance is currently `MANUAL`.
- No real-project Headless test has been created or executed. The first business candidate is `TC-AVA-LOG-001`, classified `AUTO_UNIT` but currently `BLOCKED` for safe assembly execution.

See `reports/real-avalonia-automation-assessment.md` and `reports/real-avalonia-phase2b-report.md` for evidence and the full matrix.

## Phase 2C real-project Harness

The real project is tested through a separate Avalonia `11.3.14` / `net8.0` Harness under `tests/avalonia/real-project`. The existing generic fixture under `tests/avalonia/headless` remains Avalonia `12.1.0` and is an independent regression baseline.

- `TC-AVA11-ENV-001`: PASS; independent 11.3.14 window, control tree, binding, command, and Headless input baseline.
- `TC-AVA-LOG-001`: PASS; real `AnalysisQueryState` loaded from the read-only runtime `HZ.LogClient.dll`, with no ProjectReference or source build.
- `TC-AVA-ANALYSIS-001`: PASS; real `AnalysisView` constructor/control-tree smoke in Headless. This does not cover file pickers, dialogs, export, shell opening, or desktop window integration.
- Full AnalysisView/ReplayView workflows remain `AUTO_HEADLESS_WITH_MOCK` candidates and may be `PRODUCT_CHANGE_RECOMMENDED` if direct storage/dialog coupling cannot be isolated. No product changes are made here.
- Appium is not installed. Native OS behaviors remain deferred to the separately scoped next stage.

Machine-specific paths are documented in `config/local-projects.example.json`; copy it to ignored `config/local-projects.json` only when local overrides are needed. The submitted repository contains no real DLL.

See `reports/real-avalonia-phase2c-report.md` for package versions, DLL/reference decisions, source integrity, test output, and the remaining boundary.

## Phase 3A real business Headless / Mock extension

Phase 3A uses the read-only compiled `HZ.LogClient.dll` from the configured runtime directory and keeps the real source directory and runtime directory unchanged. It adds:

- `TC-AVA-ANALYSIS-002`: real filter input invalidates the query snapshot and clears result UI.
- `TC-AVA-ANALYSIS-003`: real result-limit action updates query state and visible text.
- `TC-AVA-REPLAY-001`: real replay time-range state updates slider bounds and time labels.

No ProjectReference, source copy, Mock/Fake product object, Appium installation, or product-side AutomationId change is used. Full package/session loading remains a test-double boundary; native picker/export/window behavior is `NEEDS_APPIUM`; map pixels remain `MANUAL`; missing stable AutomationIds and direct storage/session coupling are `PRODUCT_CHANGE_RECOMMENDED` recommendations only.

See `reports/real-avalonia-phase3a-report.md`, `reports/real-avalonia-automation-assessment.md`, and `reports/appium-e2e-candidate-list.md`.

## Phase 3B real HZ.LogClient.exe Appium E2E

Phase 3B added project-local Appium 3.6.0 and Appium Windows Driver 6.1.1. The Appium server itself started and returned ready, but the official Microsoft WinAppDriver 1.2.1 backend was not discoverable after installation attempts, so `TC-AVA-E2E-ENV-001` is `BLOCKED`. `TC-AVA-E2E-001` is also `BLOCKED` because no approved non-sensitive parser-valid package is configured; the real executable was not falsely reported as launched or connected.

The E2E scripts, lifecycle helpers, and ignored evidence boundary are under `tests/avalonia/e2e/` and `artifacts/phase3b/`. No Android SDK, Android Studio, unrelated driver, product source, runtime file, AutomationId, or coordinate-based formal locator was added. See [real-avalonia-phase3b-report.md](<E:/automated-testing/reports/real-avalonia-phase3b-report.md>) for the exact blocker and next prerequisites.

## Directory guide

- docs/requirements: requirement source and analysis
- docs/designs: test and system design documents
- docs/flows: user and test flows
- test-cases: TestCase source records
- tests/web: Playwright Web tests
- tests/api: reserved API automation boundary
- tests/avalonia/headless: independent Avalonia Headless fixture
- tests/avalonia/real-project/headless: independent Avalonia 11.3.14 real-project Harness and bounded real-view smoke
- tests/avalonia/real-project/unit: runtime-DLL unit tests for real business state
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

Run the Avalonia 11.3.14 real-project Harness:

    dotnet test tests/avalonia/real-project/headless/AutomatedTesting.Avalonia11.RealProject.Headless.csproj

Run the real-project runtime-DLL unit test:

    dotnet test tests/avalonia/real-project/unit/AutomatedTesting.Avalonia.RealProject.Unit.csproj

Run the Phase 3A real business Headless cases:

    dotnet test tests/avalonia/real-project/headless/AutomatedTesting.Avalonia11.RealProject.Headless.csproj

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
