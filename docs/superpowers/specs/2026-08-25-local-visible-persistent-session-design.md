# LOCAL_VISIBLE_PERSISTENT Session Runner Design

**Date:** 2026-08-25

**Status:** Approved by the user for implementation.

## Goal

Provide a single-process local Project Playwright session that launches one dedicated headed Chromium profile, owns one BrowserContext and one explicit RuntimePage, runs PREP-01 followed by a read-only reuse check, and closes only after the session capability verification finishes.

## Scope

This change implements and executes only:

1. `PREP-01-ADMIN-LOGIN-SMOKE` using the dedicated persistent session.
2. A second read-only RuntimePage check equivalent to PREP-02 entry-point/shell verification, using the same session identity.

PREP-03 through PREP-06, all formal business TestCases, Agent Browser, `browser-client.mjs`, database writes, fixture creation, and product-source changes remain out of scope.

## Session architecture

The runner is a single Node/Playwright process. It calls `launchPersistentContext()` once with a repository-owned ignored profile directory, creates or explicitly adopts one RuntimePage, and passes that same session object to the two focused handlers:

```text
LOCAL_VISIBLE_PERSISTENT Session Runner
  -> Persistent headed Chromium
    -> dedicated persistent BrowserContext
      -> explicit RuntimePage
        -> PREP-01 login
        -> normalize + read-only reuse check
        -> controlled session teardown
```

The persistent browser profile is under the project-owned ignored artifact/config area. It is never the user's daily Chrome profile and does not read ordinary Chrome cookies, extensions, or sessions. Credentials remain in ignored local project configuration and are never copied to reports, evidence, logs, or the profile path by the test code.

## RuntimePage ownership

The session stores `runtimePage` explicitly and never selects a page by `context.pages()[0]` or creates a formal page with `tabs.new()`. If a persistent context starts with an initial blank page, bootstrap explicitly adopts it as RuntimePage; otherwise it creates one page and closes only session-owned extra blank pages. The session invariant requires one open RuntimePage, zero unexpected tabs, and zero unexpected windows.

Each focused handler begins with RuntimePage invariant and UI guard, normalizes any test-owned transient UI, navigates to its own known entry state, and performs its own verification. Shared Session identity is explicit infrastructure state, not implicit business state.

## Interaction and user observation policy

The browser is headed and remains visible while the session runs. Interaction remains unattended. During RUNNING, `UserInteractionPolicy=OBSERVE_ONLY_WHILE_RUNNING`; user observation is not a test action, evidence source, prerequisite, or result. IDLE viewing is tolerated, but the next handler rechecks invariant, normalizes UI, and navigates to its known state.

## Focused rerun and failure handling

The runner accepts a bounded focused attempt value. A handler failure stops the current verification; one diagnose/minimal-fix/focused-rerun is permitted without restarting the browser when the Session remains healthy. If the Context or RuntimePage is invalid, only that Session resource may be rebuilt and reauthenticated. The runner never loops Run -> Edit -> Run and never restarts the full preparation chain by default.

## CI and Synthetic isolation

`LOCAL_VISIBLE_PERSISTENT` is selected only by the local real-project Session Runner. CI and Synthetic retain their existing headless ephemeral Playwright behavior. The default Playwright configuration is not globally changed to persistent or headed.

## Evidence and acceptance

The sanitized session report must contain:

- `BrowserSessionMode=LOCAL_VISIBLE_PERSISTENT`
- `FormalHarness=PROJECT_PLAYWRIGHT`
- `BrowserVisibility=HEADED`
- `InteractionMode=UNATTENDED`
- `BrowserWindowVisible=Yes`
- `BrowserLaunchCount=1`
- `ContextCount=1`
- `RuntimePageCount=1`
- `SessionReused=Yes`
- `UnexpectedWindows=0`
- `UnexpectedTabs=0`
- `UserInteractionPolicy=OBSERVE_ONLY_WHILE_RUNNING`
- `PREP_01=PASS`
- `SecondReadOnlyCheck=PASS`
- `AgentBrowserPluginUsed=No`
- `FormalBusinessCasesExecuted=No`
- `PREP_03_TO_06_EXECUTED=No`

Timing fields are `BrowserLaunchMs`, `GotoMs`, `LoginMs`, `SecondCheckMs`, and `TotalMs`. The report must not contain passwords, cookies, tokens, or session contents.
