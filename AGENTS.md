# Automation Test Repository Rules

1. Create or update a TestCase before writing every formal automated test.
2. Every formal test must have a unique TestCaseId.
3. TestCase records and automation code must be linked by TestCaseId.
4. Do not modify the product under test to make an automation test pass.
5. By default, modify only this automation-testing repository.
6. If a product bug is suspected, report it with evidence; do not fix product code here.
7. Use only these execution statuses: PASS, FAIL, ERROR, BLOCKED, MANUAL, and SKIPPED.
8. Prefer Playwright for Web UI automation.
9. Prefer role, label, test id, and stable semantic locators in that order.
10. Do not use fixed screen-coordinate clicks as standard Web UI automation.
11. Do not use large fixed sleeps to solve asynchronous behavior.
12. Prefer Playwright auto-waiting and explicit condition-based waits.
13. Execute generated automation scripts for real.
14. Never claim success from generated code without an executed test result.
15. When execution fails, classify the cause as test-script error, environment error, product failure, or blocked.
16. Preserve logs, screenshots, traces, and error stacks whenever available.
17. Mark unreliable automation as MANUAL instead of forcing automation.
18. Avalonia work follows Headless tests first, then a small Appium real desktop E2E set.
19. Avalonia Headless tests must not depend on a real Desktop Session or screen coordinates; validate ViewModel, Command, Binding, and Control State.
20. Appium is only for real desktop E2E scenarios that Headless cannot cover, and Appium installation is prohibited during the current Phase 2 initialization.
21. Real Avalonia business projects are read-only by default; do not change product code, AutomationId, or testability interfaces to make tests pass.
22. Never commit keys, passwords, tokens, secrets, or sensitive configuration.
23. Keep all Markdown, TypeScript, JSON, and text files encoded as UTF-8.
24. Keep generated reports in reports and generated evidence in artifacts.
25. Keep node_modules and browser binaries out of Git.

## Real Project Safety Rules

1. `D:\HZ_RSS40\03_trunk\src_m_logclient` is read-only source evidence for Phase 2B / Phase 2.5.
2. Do not modify, format, generate into, commit, push, stash, checkout, reset, or clean the real source directory.
3. Put all test adapters, reports, scripts, and test doubles in `E:\automated-testing` only.
4. Do not change product source, AutomationId, test hooks, InternalsVisibleTo, NuGet dependencies, or DI solely to make automation pass.
5. Prefer Mock, Fake, Stub, or Test Double for external services and side-effecting paths.
6. If safe automation is not possible, record `BLOCKED` or `PRODUCT_CHANGE_RECOMMENDED` with the evidence and do not fabricate PASS.
7. Distinguish real product failures from test infrastructure errors.
8. Do not execute destructive tests against real production files, databases, services, devices, or network endpoints.
9. Do not build or restore a real source project when it would write `bin`, `obj`, generated resources, or other outputs into the read-only source tree.
10. Runtime binaries may be inspected read-only; they are not permission to replace, patch, inject, or instrument the installed application.

## Real Avalonia Version Rules

1. The independent baseline fixture under `tests/avalonia/headless` is pinned to Avalonia `12.1.0`; preserve it as an independent regression baseline.
2. The real LogClient runtime and source project are Avalonia `11.3.14` on `net8.0`; real-project tests must use an independent `11.3.14` Harness under `tests/avalonia/real-project`.
3. Do not mix Avalonia 12 packages with the real-project Harness, and do not downgrade the existing baseline fixture to make real-project tests compile.
4. Prefer the read-only compiled runtime assembly for real-project business tests. Do not add a `ProjectReference` when restore/build could write `bin`, `obj`, generated resources, or other outputs under the source project.
5. The version-matched Harness may reference only test-repository packages and test-owned helpers. Machine-specific source/runtime locations belong in `config/local-projects.example.json` and the ignored `config/local-projects.json`, not scattered through tests.
6. A PASS from the real-project Harness must identify the exact Avalonia package version, target framework, assembly path, and executed TestCaseId. A constructor/control-tree smoke does not imply that native file pickers, dialogs, export, desktop window state, or visual map acceptance are covered.

## Phase 3A Business Automation Rules

1. Phase 3A real business tests load `HZ.LogClient.dll` from `E:\logclient\logclient20260812\net8.0` through the independent Avalonia 11.3.14 Harness; do not add a `ProjectReference` to the real project.
2. `D:\HZ_RSS40\03_trunk\src_m_logclient` and `E:\logclient\logclient20260812\net8.0` remain read-only. Do not build, restore, patch, instrument, clean, or generate into either location.
3. Write TestCase records under `test-cases/avalonia/` before formal test methods. Every new AnalysisView or ReplayView behavior test must retain its TestCaseId in the executable method name and report.
4. Use this classification priority: `AUTO_UNIT` before Headless; Headless before Appium; native file picker/window/shell behavior is `NEEDS_APPIUM`; Canvas pixel and visual fidelity claims are `MANUAL`.
5. Test doubles, adapters, fakes, stubs, test data, reports, and scripts belong only in `E:\automated-testing`. Do not copy product source or production log packages into the repository.
6. Use a Test Double only when the real product structure permits safe replacement. If direct storage/session/file/timer dependencies cannot be replaced from the external Harness, record the exact blocker and use `PRODUCT_CHANGE_RECOMMENDED`; never fabricate a PASS.
7. Missing stable `AutomationProperties.AutomationId` values are a product-side recommendation for the approved Appium surface only. Do not modify AXAML or product code during Phase 3A.
8. Before completion, recompute the source-tree hash using the Phase 2B/2C manifest method, excluding only build/cache/temp directories, and require equality before and after. Appium remains uninstalled and Phase 3B is not started.
