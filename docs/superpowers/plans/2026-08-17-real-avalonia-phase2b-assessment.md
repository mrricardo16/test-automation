# Real Avalonia Phase 2B Assessment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Assess the real HZ.LogClient Avalonia project for safe Headless, unit, mock, Appium, and manual automation boundaries without modifying its source tree.

**Architecture:** Treat `D:\HZ_RSS40\03_trunk\src_m_logclient` and `E:\logclient\logclient20260812\net8.0` as read-only evidence sources. Write only the assessment report, TestCase record, repository guidance, and any explicitly safe test-repository files under `E:\automated-testing`. Preserve the independent Phase 2 fixture and do not install Appium.

**Tech Stack:** PowerShell read-only inspection, .NET 8/Avalonia 11.3.14 evidence from the real project, existing Avalonia Headless 12.1.0 fixture, xUnit, Playwright, Git.

## Global Constraints

- Never modify `D:\HZ_RSS40\03_trunk\src_m_logclient`.
- Never write temporary or generated files into the real source directory.
- Do not build or restore the real source project if that can create or update its `bin`/`obj` outputs.
- Do not install Appium, WinAppDriver, Android SDK, Java, or desktop E2E tooling.
- Write all assessment artifacts only under `E:\automated-testing`.
- Do not copy real business source, DLLs, EXEs, runtime packages, secrets, or production data into the automation repository.
- Classify uncertain or unsafe business automation as `BLOCKED` or `PRODUCT_CHANGE_RECOMMENDED`; never claim PASS without executing the actual test.
- Keep `TC-AVA-ENV-001` and `TC-WEB-ENV-001` green.

---

### Task 1: Capture source and automation repository baselines

**Files:**
- Modify: `reports/real-avalonia-phase2b-report.md`

- [ ] Record automation repository branch, status, recent commits, remote, and `origin/main...HEAD` before analysis.
- [ ] Record the specified source root Git result. If it is not a Git repository, record that fact and inspect the nested project directory without inventing a commit.
- [ ] Record the real source path and runtime path exactly as provided by the request.

### Task 2: Analyze the real project from source evidence

**Files:**
- Modify: `reports/real-avalonia-phase2b-report.md`

- [ ] Record `HZ.LogClient.csproj` TargetFramework, Avalonia packages, Newtonsoft.Json, Semi.Avalonia, Ursa, resource includes, and existing `InternalsVisibleTo`.
- [ ] Record `Program.cs` and `App.axaml.cs` startup behavior.
- [ ] Record the actual MainWindow, AnalysisView, ReplayView, custom controls, models, and services from their source paths.
- [ ] Record the absence of a dedicated ViewModel/DI layer when supported by search results.
- [ ] Record file picker, ZIP, JSON, HTML export, dialogs, Canvas/drawing, image resources, and OS/window dependencies.
- [ ] Record runtime executable, assembly versions, Avalonia runtime components, and dependency evidence without modifying or launching the runtime unless static evidence is insufficient.

### Task 3: Create the automation assessment matrix

**Files:**
- Create: `reports/real-avalonia-automation-assessment.md`

- [ ] Add one evidence-backed row for each major module or behavior: pure models/services, AnalysisView, ReplayView/map canvas, MainWindow/App, and file/dialog/export flows.
- [ ] Use only `AUTO_UNIT`, `AUTO_HEADLESS`, `AUTO_HEADLESS_WITH_MOCK`, `NEEDS_APPIUM`, `MANUAL`, `BLOCKED`, and `PRODUCT_CHANGE_RECOMMENDED`.
- [ ] Include Module, View, ViewModel, PrimaryControls, ExternalDependencies, HeadlessSuitability, RecommendedTestLayer, AutomationClassification, Risk, Reason, and RecommendedNextStep.
- [ ] Include classification counts and explain whether counts are module-level assessment rows rather than test-case counts.

### Task 4: Define the first real business TestCase and implementation decision

**Files:**
- Modify: `test-cases/avalonia/README.md`
- Create: `test-cases/avalonia/TC-AVA-LOG-001.md`

- [ ] Select a meaningful lowest-dependency target from real source evidence, preferably `AnalysisQueryState` or another real local business state transformation if it is the safest candidate.
- [ ] Add SourceCodeReference fields for the real View, ViewModel, Command, or key source paths; explicitly record when no ViewModel or Command exists.
- [ ] Link the TestCase to the matrix classification and distinguish `AUTO_UNIT` suitability from actual Headless execution.
- [ ] Create a test under `tests/avalonia/real-project` only if a safe read-only assembly path is confirmed. Otherwise classify the case as `BLOCKED` or `PRODUCT_CHANGE_RECOMMENDED` and do not create a fake PASS.

### Task 5: Update repository guidance and report the decision

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`
- Create: `reports/real-avalonia-phase2b-report.md`

- [ ] Add explicit real-project read-only rules, source integrity rules, mock/fake preference, and product-change recommendation behavior.
- [ ] Document the actual conclusion for direct Headless, Mock, Appium, Manual, first business Case, and implementation status.
- [ ] Record that Appium remains uninstalled and that the existing independent fixture remains separate.

### Task 6: Regression, source integrity, commit, and push

- [ ] Re-run `dotnet test tests/avalonia/headless/AutomatedTesting.Avalonia.Headless.csproj`, `npm ci`, and `npm test`.
- [ ] Re-check the real source path using the same read-only commands and compare against the initial baseline.
- [ ] Run `git diff --check`, UTF-8 checks, and scans for copied binaries, source trees, secrets, `bin`, `obj`, and runtime packages.
- [ ] Commit only automation-repository changes with `feat: assess real Avalonia project testability` unless a more precise message is justified by an actually executed test.
- [ ] Push `main` without force and verify `origin/main...HEAD = 0 0`.
