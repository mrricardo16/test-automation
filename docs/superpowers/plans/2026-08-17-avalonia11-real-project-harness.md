# Phase 2C Avalonia 11.3.14 Real-Project Harness

## Scope

- Keep `D:\HZ_RSS40\03_trunk\src_m_logclient` and `E:\logclient\logclient20260812\net8.0` read-only.
- Add all harness code, test cases, configuration templates, evidence, and reports only under `E:\automated-testing`.
- Preserve the existing Avalonia 12.1.0 fixture under `tests/avalonia/headless`; do not change its package versions or add a real-project reference.
- Do not install Appium, modify the product, or build/restore the product source project.

## Implementation Steps

1. Re-read Phase 2B assessment/report, TestCase, repository rules, README, and the existing independent Headless fixture; verify the clean repository baseline and source hash.
2. Confirm the real project and runtime versions from read-only source/runtime evidence, then test restore availability for an independent Avalonia 11.3.14 Headless harness.
3. Add a non-secret local-project configuration example and ignore the machine-local configuration file.
4. Create `tests/avalonia/real-project/headless` as an independent net8.0 xUnit harness using Avalonia 11.3.14 and implement `TC-AVA11-ENV-001` for window/control tree, binding, command, and Headless input.
5. Create `tests/avalonia/real-project/unit` and implement `TC-AVA-LOG-001` against the read-only compiled `HZ.LogClient.dll` through a controlled runtime assembly loader, without ProjectReference or source build.
6. Use the version-matched harness to attempt the lowest-dependency real UI candidate. Report `AUTO_HEADLESS_WITH_MOCK`, `BLOCKED`, or `PRODUCT_CHANGE_RECOMMENDED` according to executed evidence; never convert an inaccessible view into a fake PASS.
7. Update the classification matrix, TestCase records, README hierarchy, AGENTS real-project version rules, and the Phase 2C report with exact package/reference/compatibility decisions and source integrity evidence.
8. Run the old fixture, new Harness, real unit test, Web regression, `npm ci`, `git diff --check`, and source hash comparison. Commit intentionally, push `main`, verify remote synchronization, and stop at the Phase 2C boundary.

## Verification Gates

- Existing `TC-AVA-ENV-001` PASS.
- New `TC-AVA11-ENV-001` PASS.
- `TC-AVA-LOG-001` is a real executed result or explicitly BLOCKED with the exact runtime reason.
- `TC-WEB-ENV-001` PASS and `npm ci` PASS.
- Source aggregate hash before and after is identical.
- Appium is not installed.
- `origin/main...HEAD` is `0 0` after push.
- No product source, runtime binary, or runtime configuration file is modified.
