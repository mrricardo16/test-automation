# PROJECT_PREPARATION Execution Model Design

**Date:** 2026-08-25

**Status:** Approved by the user for implementation.

## Goal

Replace the monolithic `PROJECT_PREPARATION` Playwright flow with six independently executable preparation steps, while implementing and executing only `PREP-01-ADMIN-LOGIN-SMOKE` in this change.

## Scope

The six focused steps are:

- `PREP-01-ADMIN-LOGIN-SMOKE`: runtime reachability, authorized admin login, authenticated Dashboard, and UI normalization.
- `PREP-02-USER-ROLE-INVENTORY`: read-only inventory of test-owned user, role, BB25_ fixture, and management entry points.
- `PREP-03-ROLE-FIXTURE`: create or reuse and verify the test-owned role fixture.
- `PREP-04-USER-FIXTURE`: create or reuse and verify the test-owned ordinary user.
- `PREP-05-PERMISSION-BINDING`: bind the test-owned user to the test-owned role and verify the relationship.
- `PREP-06-CLEANUP-CAPABILITY`: disposable test-owned create/query/delete/query probe only.

Only PREP-01 may execute in this task. No account, role, permission, business-data, cleanup-probe, database, or formal business TestCase operation may occur.

## Architecture

Each step is a separate Playwright test entry point with its own setup, action, verification, UI normalization, report, and teardown. Steps do not depend on Playwright test order or implicit browser/context/page state. A step may be rerun by its own title or focused runner command.

Shared runtime helpers own the explicit `Browser -> BrowserContext -> RuntimePage` chain and enforce the RuntimePage invariant. Login success is a bounded combination of configured-origin match, authenticated URL route, and visible authenticated business shell/navigation. `networkidle` is not used as a login-success condition.

`normalizeUiState()` and the navigation guard inspect and close only test-run-owned Drawer, Dialog, Modal, Popover, and blocking Overlay state, then wait for hidden/removed state. Unknown blocking product state stops the current step with `ERROR_UI_STATE`.

The focused runner permits at most one `Diagnose -> Minimal Fix -> Focused Rerun` cycle. It never edits helpers during a running step and has an explicit infinite-self-repair guard.

## Local browser policy

The local project configuration sets `PlaywrightHeadless: false` for `PROJECT_PREPARATION`. The Playwright configuration remains headless-capable for CI, Synthetic, and unattended regression use. Interaction mode remains `UNATTENDED`; headed visibility is observational and never requests human input.

## PREP-01 flow

```text
owned Browser
  -> owned BrowserContext
    -> owned RuntimePage
      -> runtime navigation
      -> authorized admin credential submission
      -> combined authenticated Dashboard verification
      -> normalizeUiState()
      -> step report
      -> close owned context/browser resources
```

PREP-01 reports `PrepStepId`, `Status`, elapsed timing fields, `HarnessType`, `BrowserVisibility`, `InteractionMode`, `RuntimeOrigin`, `PageCount`, `FinalUrl`, `HarnessError`, fixture/cleanup fields, `UiStateNormalized`, and evidence references. Its status is preparation-only (`PASS`, `ERROR`, or `BLOCKED`) and cannot be reported as a formal business execution result.

## Error handling and stop policy

`ERROR_LOCATOR`, `ERROR_TIMEOUT`, `ERROR_NAVIGATION`, `ERROR_PLAYWRIGHT`, `RuntimePageInvariantFailed`, and `UIStateNotNormalized` stop the current step immediately. The run records the last successful state and evidence. Only one focused rerun is permitted after a minimal harness fix; repeated failure ends with `PREP_STEP_STATUS = ERROR` and a root-cause candidate instead of another automatic edit/run cycle.

## Acceptance criteria

- The monolithic preparation flow is no longer the execution entry point.
- All six focused step definitions and independent runner boundaries exist.
- PREP-01 executes through `PROJECT_PLAYWRIGHT` with headed Chromium and `UNATTENDED` interaction.
- PREP-01 verifies authenticated Dashboard without requiring the single `调度总览` heading and without `networkidle`.
- PREP-01 normalizes UI state and ends without unexpected blank pages.
- No Agent Browser, `browser-client.mjs`, formal business TestCase, fixture mutation, cleanup probe, DB test, or product-source change occurs.
- PREP-01 is the only preparation step executed, and execution stops immediately after its result.
