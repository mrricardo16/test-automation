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

Deferred or not implemented:

- Avalonia Appium E2E
- Phase 2B / Phase 2.5 real Avalonia project Headless integration
- API automation
- CI/CD
- Automatic requirement parsing
- Automatic test-case generation
- Result aggregation

Avalonia Phase 2 uses an independent code-only Headless fixture first. Phase 2B / Phase 2.5 is reserved for later real Avalonia project Headless integration. Appium remains uninstalled and out of scope for the current phase.

## Directory guide

- docs/requirements: requirement source and analysis
- docs/designs: test and system design documents
- docs/flows: user and test flows
- test-cases: TestCase source records
- tests/web: Playwright Web tests
- tests/api: reserved API automation boundary
- tests/avalonia/headless: independent Avalonia Headless fixture
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
