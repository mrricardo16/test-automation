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

Not implemented:

- Avalonia Headless
- Avalonia Appium E2E
- API automation
- CI/CD
- Automatic requirement parsing
- Automatic test-case generation
- Result aggregation

Avalonia is intentionally staged for later: Headless tests first, then a small set of real desktop E2E tests using Appium.

## Directory guide

- docs/requirements: requirement source and analysis
- docs/designs: test and system design documents
- docs/flows: user and test flows
- test-cases: TestCase source records
- tests/web: Playwright Web tests
- tests/api: reserved API automation boundary
- tests/avalonia: deferred Avalonia automation boundary
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
