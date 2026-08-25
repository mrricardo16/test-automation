# Formal Web Harness Boundary Correction

## Goal

Make `PROJECT_PLAYWRIGHT` the only formal Web harness and give Agent Browser / `browser-client.mjs` diagnostic-only authority without deleting or disabling those exploratory tools.

## Contract

The canonical machine-readable policy lives in `scripts/platform/harness-authority.mjs`. It defines `HarnessType`, formal workflow phases, the required formal harness, diagnostic-only phases, eligibility values, and authority decisions. A formal Web operation, Project Preparation mutation, Regression, or formal Evidence operation is eligible only when `HarnessType=PROJECT_PLAYWRIGHT`. Agent Browser and `browser-client.mjs` are valid only for `EXPLORATION`, `DIAGNOSTIC`, and `ENVIRONMENT_OBSERVATION`, and their result is `DIAGNOSTIC_ONLY`.

The validator rejects formal Agent Browser use with `HARNESS_AUTHORITY_VIOLATION`, rejects Agent Browser state mutation during Project Preparation, rejects Agent Browser-only formal evidence, and rejects fallback after Playwright is unavailable with `HARNESS_FALLBACK_FORBIDDEN`. Missing Runtime URL and missing credentials remain blocked conditions; they never authorize a second harness.

## Runtime lifecycle

The formal runner owns one `Browser`, one authenticated `BrowserContext` per role, and one explicit `RuntimePage`. `runtime-session.ts` provides ownership and fail-fast page checks. `runtime-login.ts` receives the owned page, navigates with bounded conditions, verifies origin and non-blank URL, and reuses that page/context. It does not select `context.pages()[0]`, call `tabs.new()`, or create an implicit helper page. Product popups remain valid Playwright-owned multi-page exceptions only when declared by a TestCase.

## Documentation and project state

The TEST-EXECUTION Skill and Web runtime references state the authority boundary, fallback policy, RuntimePage invariant, session reuse, and evidence source. The `rsscomposer-blackbox` project records the same authority fields in `project.json` and its execution, preparation, evidence, environment, and current-status documents. The project validator checks those fields.

## Verification

Six Playwright Synthetic governance cases cover: Project Playwright formal Web allowed, Agent Browser formal Web rejected, Agent Browser diagnostic observation allowed, Agent Browser Project Preparation mutation rejected, Project Playwright Project Preparation allowed, and Playwright unavailable blocked without Agent Browser fallback. These cases validate governance only; no real Runtime or business TestCase is started.

