# WEB-EVIDENCE-001 Web UI failure evidence report

## Scope and repository state

This phase changed only `E:\automated-testing`. The real Web product source at `D:\HZ_RSS40\03_trunk\src_m_ui` was inspected only through its source-tree integrity hash; no source, configuration, runtime binary, or product testability surface was modified. The worktree was clean when this phase began, so there were no unrelated tracked changes to preserve.

The source-tree hash before the work was `fc51ed641ed79de24674e9a9f10d84ff0448f0259c3221fe411e735f5c21c2d8` across 643 files. The after hash and count are identical.

## Implemented evidence policy

`tests/web/helpers/evidence.ts` provides the shared Playwright `test`, `expect`, and `evidence` fixture. It creates a UTC/PID/worker/retry RunId directory at `artifacts/web/<TestCaseId>/<RunId>/` when a checkpoint or failure bundle is needed.

The fixture automatically finalizes a bundle for `FAIL`, `ERROR`, and explicit `BLOCKED` runs. The bundle contains the safe screenshot result, current URL, current step, locator context, console records, page errors, failed requests, HTTP 4xx/5xx records, and a Markdown failure summary. Screenshot collection attempts full-page capture first, falls back to viewport capture, and skips capture when a sensitive-looking non-password input is present. Capture errors do not replace the original case status.

Console is capped at 300 records and network evidence at 500. Network records retain only method, path, status, duration, resource type, failure text, severity, and timestamp. URLs omit query strings and fragments. Request and response bodies, headers, cookies, browser-storage snapshots, input values, and full DOM output are not written. Text evidence redacts bearer credentials and sensitive labeled values. Generated JSON and Markdown use UTF-8. The fixture attaches generated evidence to the Playwright report and attaches a trace when it exists at finalization; otherwise the summary explicitly documents trace unavailability at that moment.

The existing configuration remains `screenshot: "only-on-failure"`, `trace: "retain-on-failure"`, and `video: "off"`.

## Case integration and executed results

- `TC-WEB-ENV-001` now uses the shared fixture and records the `Open about:blank` step. It passed in the focused and default regressions.
- `TC-WEB-LOGIN-001` now uses the shared fixture while preserving the real login request/business assertions and the two explicit checkpoint names, `login-page` and `dashboard-after-login`. Duplicate telemetry, page-content export, and browser-storage inspection were removed.
- The current session had no approved `WEB_TEST_USERNAME` or `WEB_TEST_PASSWORD`; therefore `TC-WEB-LOGIN-001` was executed as `SKIPPED` with explicit `BLOCKED` evidence. No login PASS or checkpoint screenshot is claimed by this report.

Focused regression: `npx playwright test tests/web/environment.spec.ts tests/web/real-project/TC_WEB_LOGIN_001.spec.ts --reporter=list` completed with 1 passed and 1 skipped.

Default Web regression after removing the temporary self-test: `npm test -- --reporter=list` completed with 1 passed and 1 skipped (exit code 0).

## Infrastructure self-test

The temporary `INFRASTRUCTURE_SELF_TEST` was first run before the helper existed and correctly failed discovery with `Cannot find module './evidence'`. After implementation it intentionally failed its heading assertion, as designed (exit code 1), and created `artifacts/web/INFRASTRUCTURE_SELF_TEST/20260818-033103Z-pid16040-w0-r0/`.

The inspected bundle contained non-empty `failure.png`, `console-errors.json`, `page-errors.json`, `network-errors.json`, `locator-context.json`, and `failure-summary.md`. Console evidence contained the self-test marker; network evidence contained only `GET /` and its failure text. The serialized text/JSON passed the credential-redaction check and did not retain the data-URL HTML payload. Playwright produced a trace in its test-result output; the helper summary documented that the trace was unavailable at fixture finalization, which is permitted because Playwright writes the retained trace after fixture teardown. The temporary self-test source was deleted before the normal regression.

## Validation and remaining risk

`git diff --check` passed. The changed UTF-8 files passed strict decoding; the temporary self-test source is absent; generated evidence and Playwright test results are ignored by Git; and a diff scan found no credential-like value or prohibited evidence API. The real source tree remained unchanged at hash `fc51ed641ed79de24674e9a9f10d84ff0448f0259c3221fe411e735f5c21c2d8` with 643 files.

The production login PASS path remains unverified in this session because approved credentials were not supplied. When they are available, rerun the focused Web command with the credentials injected only into the process and inspect that the two checkpoint PNGs exist without a failure summary bundle.
