# Phase 3A Real Avalonia Business Headless / Mock Extension Implementation Plan

> **Execution note:** Use the `executing-plans` workflow to implement this plan task by task.

**Goal:** Extend the independent automation repository with behavior-level Headless coverage for the compiled real Avalonia 11.3.14 business DLL, without modifying the real source or runtime directories.

**Architecture:** Keep `E:\automated-testing` as the only writable scope. Load `HZ.LogClient.dll` from the configured read-only runtime through the existing reflection-based loader. Add a small test-only reflection adapter for named controls and private business state so the tests exercise real `AnalysisView` and `ReplayView` behavior without a `ProjectReference` or copied source.

**Tech stack:** .NET 8, Avalonia.Headless.XUnit 11.3.14, xUnit 2.4.2, compiled runtime DLL, PowerShell verification scripts.

### Task 1: Freeze source facts, test contracts, and baseline

- Re-read `AnalysisView`, `ReplayView`, their AXAML, relevant models/services, and the current reports.
- Capture the Phase 3A source-tree hash before implementation with the established UTF-8 path/length/SHA-256 manifest algorithm, excluding source build/cache/temp directories.
- Add `TC-AVA-ANALYSIS-002`, `TC-AVA-ANALYSIS-003`, and `TC-AVA-REPLAY-001` under `test-cases/avalonia/` before adding their test implementation.
- Record that no source or runtime files are writable and no sensitive sample is copied into the repository.

### Task 2: Establish a red-green test-only reflection adapter

- Add a focused adapter test that uses the planned `RealBusinessViewHarness` API before the adapter exists and confirm the expected compile failure.
- Implement the adapter only in the automation repository. It must load the configured real assembly, instantiate a real view, attach it to a Headless `Window`, resolve named controls, and invoke explicitly selected private/internal members for observable state setup.
- Re-run the adapter test and confirm it is green before adding business behavior assertions.

### Task 3: Implement real AnalysisView behavior cases

- Add a Headless test for filter input causing the real `AnalysisView` to invalidate its query snapshot and clear result UI state.
- Add a Headless test for the real result-limit click handler updating the real query state and visible result-limit text.
- Keep assertions at behavior/state level; do not assert translated or mojibake-prone literal UI copy when a state/property assertion is available.

### Task 4: Implement real ReplayView behavior case

- Instantiate the real `ReplayView` from the runtime DLL, attach it to Headless, invoke its real time-range state transition, and assert slider bounds/enabled state and rendered time-state controls.
- Record timer, filesystem, native picker, map-pixel, or window-system boundaries as separate classifications rather than faking them.

### Task 5: Update Phase 3A documentation and boundaries

- Expand `projects/test-workflow/reports/real-avalonia-automation-assessment.md` into behavior-level AnalysisView/ReplayView coverage and classification matrices.
- Add `projects/test-workflow/reports/appium-e2e-candidate-list.md`, `projects/test-workflow/reports/real-avalonia-phase3a-report.md`, and a safe `test-data/logclient/README.md`.
- Update `README.md` and `AGENTS.md` with the Phase 3A status and business automation rules, including the read-only source/runtime boundary and `PRODUCT_CHANGE_RECOMMENDED` policy.

### Task 6: Verify, commit, and publish only the automation repository

- Run the new tests, the existing Avalonia 12 fixture, Avalonia 11 Harness, unit test, npm checks, and `git diff --check`.
- Recompute the source-tree hash after implementation and require equality with the before hash.
- Confirm Appium remains not installed, commit the automation-repository changes, push `main`, and verify `origin/main...HEAD = 0 0` and a clean worktree.
- Stop after Phase 3A; do not begin Appium installation, source changes, CI/CD, or Phase 3B.
