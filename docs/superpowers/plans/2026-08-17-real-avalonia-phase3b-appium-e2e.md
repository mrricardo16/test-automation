# Real Avalonia Appium E2E Minimum Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and honestly execute the smallest real Windows Appium loop for `HZ.LogClient.exe`: start the real executable, connect to its Avalonia main window, capture the accessibility tree, and attempt the AnalysisView log-import path with one approved test package.

**Architecture:** Keep all code, configuration templates, TestCases, reports, and evidence under `E:\automated-testing`. Use project-local Appium 3 with the official Windows Driver and the Microsoft WinAppDriver backend only if the host prerequisites are available. The E2E harness owns only the process it starts, creates/tears down its own Appium session, uses accessibility/name/role locators before any diagnostic coordinate fallback, and classifies environment, locator, file-picker, script, and product outcomes separately.

**Tech Stack:** Node.js 24, npm 11, Appium 3.6.0, `appium-windows-driver` 6.1.1, Microsoft WinAppDriver 1.2.1 if installable, TypeScript, WebdriverIO/Appium client, PowerShell, real Avalonia 11.3.14 `HZ.LogClient.exe` on `net8.0`.

## Global Constraints

- `D:\HZ_RSS40\03_trunk\src_m_logclient` is strictly read-only; do not modify source, project files, resources, test hooks, AutomationId, or product behavior.
- `E:\logclient\logclient20260812\net8.0` is strictly read-only except for normal product runtime logs/cache; do not replace, inject, patch, or copy its files into Git.
- Do not install Android Studio, Android SDK, iOS tooling, Selenium, WinForms tooling, or unrelated drivers.
- Prefer project-local npm dependencies; do not upgrade Node or .NET.
- Do not use screen coordinates or index as the formal locator strategy. If stable locators are unavailable, report `ERROR_AUTOMATION_LOCATOR` and `PRODUCT_CHANGE_RECOMMENDED`.
- Only close the `HZ.LogClient` process started by this test run; never kill an unknown pre-existing process.
- Do not commit screenshots, page sources containing sensitive information, Appium logs, real business packages, executables, DLLs, `node_modules`, `bin`, `obj`, or local private configuration.
- Phase 3B stops after this environment Case and the single `TC-AVA-E2E-001` attempt; do not add export, Replay, map, CI/CD, or product changes.

---

### Task 1: Freeze baseline, executable facts, and Appium prerequisites

**Files:**
- Create: `docs/superpowers/plans/2026-08-17-real-avalonia-phase3b-appium-e2e.md`
- Inspect only: `config/local-projects.example.json`, `projects/test-workflow/reports/real-avalonia-phase3a-report.md`, `projects/test-workflow/reports/real-avalonia-automation-assessment.md`
- Evidence: `artifacts/phase3b/` (ignored runtime evidence only)

- [ ] **Step 1: Record Git and source-tree baseline**

Run from `E:\automated-testing`:

```powershell
git status
git branch --show-current
git log -5 --oneline
git remote -v
git rev-list --left-right --count origin/main...HEAD
```

Compute the established UTF-8 path/length/SHA-256 manifest hash for `D:\HZ_RSS40\03_trunk\src_m_logclient`, excluding `bin`, `obj`, `.vs`, temporary caches, and build artifacts. Expected baseline is a 41-file manifest and the Phase 3A hash unless the read-only source has changed externally.

- [ ] **Step 2: Scan the runtime directory for the actual executable**

Use `Get-ChildItem -LiteralPath E:\logclient\logclient20260812\net8.0 -Filter *.exe` and inspect file version metadata for each candidate. Select the actual `HZ.LogClient.exe`; record its full path, file version, `HZ.LogClient.dll` version, target framework, and Avalonia package version from existing project/runtime evidence. Do not infer the name before the scan.

- [ ] **Step 3: Scan Appium and platform prerequisites before installation**

Run `node --version`, `npm --version`, `dotnet --version`, `java -version`, `appium --version`, `where appium`, `where java`, `npm list appium`, `npm list -g appium`, `appium driver list --installed` when available, and checks for `WinAppDriver.exe`, Android SDK, Windows version, and developer mode. Record missing items and whether any installer requires elevation.

### Task 2: Create TestCase and local test-data contracts before scripts

**Files:**
- Create: `test-cases/avalonia/TC-AVA-E2E-ENV-001.md`
- Create: `test-cases/avalonia/TC-AVA-E2E-001.md`
- Modify: `test-data/logclient/README.md`
- Modify only if needed: `config/local-projects.example.json`

- [ ] **Step 1: Write `TC-AVA-E2E-ENV-001`**

Define the environment Case as Appium server → Windows Driver → start the real executable → create a session → read the MainWindow page source → close the owned session/process. Its result must be `PASS`, `ERROR`, or `BLOCKED`; it cannot substitute for the business Case.

- [ ] **Step 2: Write `TC-AVA-E2E-001`**

Define the single business path: start real exe → connect MainWindow → enter Analysis → trigger real import picker → select one approved non-sensitive package → wait for a deterministic import-success state → capture evidence. The MVP Expected Result must be exactly the verified observable state; if no package is available, classify `BLOCKED` and do not invent a fixture.

- [ ] **Step 3: Record fixture provenance**

Use a local ignored path such as `test-data/logclient/local/` only after confirming a non-sensitive package or constructing a parser-valid synthetic package from the actual format. Keep only a preparation README and expected-result contract in Git. Never copy a production package from `D:\HZ_RSS40` or `E:\logclient`.

### Task 3: Install the smallest compatible Appium chain

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create or modify ignored local configuration only: `config/local-projects.json`
- Evidence: `artifacts/phase3b/appium-install.log` (ignored)

- [ ] **Step 1: Install project-local Appium with a pinned compatible version**

Because Node 24/npm 11 satisfy the current Appium engine range, install only the pinned core package:

```powershell
npm install --save-dev --save-exact appium@3.6.0
```

- [ ] **Step 2: Install the official Windows Driver package**

Install the Appium Windows Driver matching Appium 3, pinning `appium-windows-driver` 6.1.1 if the CLI supports the package selector. Verify with `npx appium driver list --installed`. Do not install an Android or unrelated driver.

- [ ] **Step 3: Install or evaluate WinAppDriver backend**

Run the official driver script for WinAppDriver. If it requires system-level elevation or a missing Developer Mode prerequisite, stop that installation step and record `BLOCKED` with the exact tool, version, reason, scope, and permission requirement. Do not bypass the requirement or silently use coordinates.

### Task 4: TDD the environment probe and process/session lifecycle

**Files:**
- Create first: `tests/avalonia/e2e/appium/TC_AVA_E2E_ENV_001_AppiumEnvironment.spec.ts`
- Create: `tests/avalonia/e2e/appium/appium.config.ts`
- Create: `tests/avalonia/e2e/helpers/real-app-process.ts`
- Create: `tests/avalonia/e2e/helpers/appium-session.ts`
- Create: `tests/avalonia/e2e/helpers/evidence.ts`

- [ ] **Step 1: Write a failing environment contract test**

Write the smallest test that calls the planned session helper and asserts a non-empty page source and a top-level window. Run only this test before implementing the helper and verify it fails because the helper is absent or the environment is unavailable, not because of a typo.

- [ ] **Step 2: Implement owned-process lifecycle**

Start the exact executable path from ignored local configuration, capture the returned PID and start time, reject an already-running same-name process as an explicit precondition warning, wait on the owned process window, and close only the owned PID in `finally`. Never issue `taskkill /IM`.

- [ ] **Step 3: Implement Appium session lifecycle**

Start a project-local Appium server on a configured local port, create a Windows session with `platformName=windows`, `appium:automationName=windows`, `appium:app=<absolute exe>`, and a bounded launch timeout, capture page source, and always call `deleteSession` and stop only the owned server process.

- [ ] **Step 4: Run the environment Case green or classify the actual blocker**

If the server, driver, executable, session, and page source all work, mark `TC-AVA-E2E-ENV-001=PASS`. If a prerequisite prevents execution, mark `BLOCKED`; if the automation itself fails after prerequisites are present, mark `ERROR`. Preserve exact logs and stack traces.

### Task 5: Inspect accessibility tree and implement the single business Case

**Files:**
- Create: `tests/avalonia/e2e/appium/TC_AVA_E2E_001_RealLogImport.spec.ts`
- Create: `tests/avalonia/e2e/helpers/locators.ts`
- Create: `tests/avalonia/e2e/helpers/file-picker.ts`
- Evidence: ignored `artifacts/phase3b/appium-page-source-initial.xml`, `appium-page-source-analysis.xml`, screenshots on failure

- [ ] **Step 1: Save initial and AnalysisView page source**

Use Appium `getPageSource()` after connection and after navigation. Save only if the content is reviewed for sensitive data; otherwise store a redacted summary and delete the raw sensitive artifact from the working tree.

- [ ] **Step 2: Build the locator assessment**

For MainWindow, Analysis navigation, import control, and import-success state, record AutomationId, Name, ControlType, candidate locator, and stability. Use accessibility id → name/role → stable visible text → parent/child structure. Do not make index or coordinate the formal fallback.

- [ ] **Step 3: Write the business test with bounded waits**

Navigate to Analysis, click the real import control, wait for the standard Windows file dialog, enter the approved full file path through accessible file-name controls, click Open, then wait for a concrete success state such as displayed file name/package summary. Do not use a fixed ten-second sleep and do not assert only “the process did not crash.”

- [ ] **Step 4: Classify the deepest real result**

Use `PASS` only when the full path and Expected Result are observed; `FAIL` only when automation completed but product behavior contradicted the expectation; `ERROR` for driver/session/locator/file-picker/script faults; `BLOCKED` for missing data, permission, desktop session, or required backend.

### Task 6: Report, regress, hash, commit, and stop

**Files:**
- Create: `projects/test-workflow/reports/real-avalonia-phase3b-report.md`
- Modify: `projects/test-workflow/reports/real-avalonia-automation-assessment.md`, `README.md`, `AGENTS.md`, `test-data/logclient/README.md`
- Do not commit: `artifacts/`, local packages, binaries, screenshots, raw page sources, logs, or private configuration

- [ ] **Step 1: Write the report and recommendations**

Include environment versions, installed-this-phase items, both TestCase statuses, executable facts, evidence paths, data provenance, Expected Result/actual, locator and AutomationId assessment, `PRODUCT_CHANGE_RECOMMENDED`, and exact current capability boundary.

- [ ] **Step 2: Run the Phase 3A/Web regression**

Run the old Avalonia fixture, Avalonia 11.3.14 Harness, real DLL unit tests, `npm ci`, and `npm test`. Confirm every prior TestCase remains PASS.

- [ ] **Step 3: Recompute source hash and check repository hygiene**

Compute `SourceTreeHashAfter` with the same manifest method and require equality with `SourceTreeHashBefore`. Run `git diff --check` and confirm no forbidden artifacts, binaries, packages, private config, or source/runtime modifications are staged.

- [ ] **Step 4: Commit and push only the automation repository**

If implementation/evaluation is complete, commit with `feat: add real Avalonia Appium E2E harness`, push `main`, and verify `origin/main...HEAD = 0 0`. If the business Case is blocked, use a truthful commit/report status; do not claim a complete PASS.

- [ ] **Step 5: Stop**

Do not begin `TC-AVA-E2E-002`, Replay E2E, map E2E, CI/CD, AutomationId changes, or product source modifications.
