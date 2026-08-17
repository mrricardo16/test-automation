# Real Avalonia Phase 3A Report

**Date:** 2026-08-17
**Phase:** `Phase 3A：真实 Avalonia 业务 Headless / Mock 扩展`
**Repository:** `E:\automated-testing`
**Source evidence (read-only):** `D:\HZ_RSS40\03_trunk\src_m_logclient`
**Runtime evidence (read-only):** `E:\logclient\logclient20260812\net8.0`

## Outcome

Phase 3A adds three real business Headless cases against the compiled `HZ.LogClient.dll` without a `ProjectReference`, copied source, product change, Appium installation, or runtime modification:

- `TC-AVA-ANALYSIS-002`: real AnalysisView filter input invalidates query state and clears result UI.
- `TC-AVA-ANALYSIS-003`: real AnalysisView result-limit action updates query state and visible text.
- `TC-AVA-REPLAY-001`: real ReplayView range state updates slider bounds and time labels.

The existing Phase 2C cases remain in the repository and are included in regression verification.

## Implementation boundary

The only new executable infrastructure is under `tests/avalonia/real-project/headless`. `RealBusinessViewHarness` loads the configured runtime DLL, instantiates a real view, attaches it to a Headless Window, resolves real named controls, and invokes only the real members needed to set or observe deterministic state. It is not a product double and does not copy product code.

Full log import/query/replay loading, native pickers, export/shell opening, desktop window behavior, and Canvas pixels remain separately classified. Direct storage/session/file/timer dependencies are recorded as `AUTO_HEADLESS_WITH_MOCK`, `NEEDS_APPIUM`, `MANUAL`, or `PRODUCT_CHANGE_RECOMMENDED` where appropriate.

## Product testability recommendations (not implemented)

- Add injectable package/session/file abstractions or a ViewModel boundary for AnalysisView and ReplayView.
- Add stable AutomationIds for the small approved Appium surface.
- Keep map pixel acceptance separate from control-state automation.

No recommendation above was implemented in the real product.

## Test data

No real or sensitive package was copied or committed. Phase 3A uses no production log sample. Future fixtures belong under `test-data/logclient` and must be synthetic or explicitly approved.

## Stop boundary

Phase 3A stops after verification and publication of this automation repository. Phase 3B, Appium installation, WinAppDriver, source changes, CI/CD, and product-side testability changes are not started.
