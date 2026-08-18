# Web UI Failure Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Add a shared Playwright Evidence fixture that automatically captures actionable, sanitized failure evidence for Web UI FAIL/ERROR/BLOCKED outcomes while keeping PASS runs limited to explicit checkpoints.

**Architecture:** Implement a business-agnostic helper at tests/web/helpers/evidence.ts and export custom test/expect fixtures from it. The fixture attaches Console, Page Error, requestfailed, and HTTP >=400 listeners before the test body, tracks current step and locator context supplied by each Case, and finalizes a per-run Bundle after the test. Existing Web Cases import the shared fixture; Login retains only two explicit checkpoint screenshots and its business assertions.

**Tech Stack:** @playwright/test ^1.62.1, Chromium, TypeScript, Node fs/promises, PowerShell, UTF-8 JSON/Markdown.

## Global Constraints

- D:\HZ_RSS40\03_trunk\src_m_ui remains read-only.
- Only E:\automated-testing may be modified.
- Existing playwright.config.ts values remain screenshot only-on-failure, trace retain-on-failure, video off unless verification proves a minimal safe change is required.
- Failure root is artifacts/web/<TestCaseId>/<RunId>/; artifacts/, playwright-report/, and test-results/ remain ignored.
- No request/response bodies, headers, cookies, storage state, passwords, tokens, Authorization, or arbitrary full DOM are written.
- Console records are capped at 300; network records are capped at 500.
- JSON and Markdown are written as UTF-8.
- Existing formal TestCases remain the only business TestCases; the temporary self-test is explicitly infrastructure-only, is not a TestCase, and is deleted before commit.
- Preserve unrelated dirty worktree changes and stage only this phase’s intended files.
- Do not add any new business module or Web regression Case.

---

### Task 1: Create the helper API with a red infrastructure self-test

**Files:**
- Create: tests/web/helpers/evidence.ts
- Create temporarily: tests/web/helpers/evidence-self-test.spec.ts
- Read: playwright.config.ts, tests/web/real-project/TC_WEB_LOGIN_001.spec.ts, test-cases/README.md

**Interfaces:**
- Consumes: Playwright page/testInfo fixtures.
- Produces: exported test/expect and EvidenceContext with step, failure type, locator context, blocked status, checkpoint capture, automatic finalization, and explicit failure capture.

- [ ] Step 1: Write the temporary self-test before the helper implementation

Create an untracked temporary spec importing test and expect from ./evidence. The test title must contain INFRASTRUCTURE_SELF_TEST and must:
1. open a data URL with a non-sensitive heading;
2. call evidence.step("Open self-test page");
3. call page.evaluate to emit one console.error, which is allowed only in this infrastructure self-test;
4. issue a fetch to http://127.0.0.1:1/ and catch the rejection to create requestfailed evidence;
5. set failure type ERROR_ASSERTION_INFRASTRUCTURE;
6. set locator context for a missing heading;
7. assert a heading text that is intentionally absent.

Use this exact behavioral shape:

~~~typescript
import { expect, test } from "./evidence";

test("INFRASTRUCTURE_SELF_TEST - failure bundle is captured", async ({ page, evidence }) => {
  evidence.step("Open self-test page");
  await page.goto("data:text/html,<h1>Evidence Self Test</h1>");
  await page.evaluate(() => {
    console.error("INFRASTRUCTURE_SELF_TEST console marker");
    void fetch("http://127.0.0.1:1/").catch(() => undefined);
  });
  evidence.setFailureType("ERROR_ASSERTION_INFRASTRUCTURE");
  const heading = page.getByRole("heading");
  evidence.setLocatorContext({
    locatorDescription: "missing self-test heading text",
    primaryLocator: "getByRole('heading')",
    fallbackLocator: "locator('h1')",
    expectedState: "heading text equals intentionally missing value",
    locator: heading,
  });
  await expect(heading).toHaveText("This heading is intentionally absent");
});
~~~

- [ ] Step 2: Run the red self-test before implementing the helper

Run:

~~~powershell
npx playwright test tests/web/helpers/evidence-self-test.spec.ts --reporter=list
~~~

Expected: the runner reports a module/export error because evidence.ts is not implemented. This confirms the self-test is discovered; then continue to the helper implementation. Do not classify this pre-helper error as product FAIL.

- [ ] Step 3: Implement the public types and fixture contract

Create evidence.ts with these public shapes:

~~~typescript
export type EvidenceFailureType =
  | "ERROR_LOCATOR"
  | "ERROR_TIMEOUT"
  | "ERROR_NAVIGATION"
  | "ERROR_PLAYWRIGHT"
  | "ERROR_BROWSER"
  | "ERROR_ASSERTION_INFRASTRUCTURE"
  | "FAIL_UI_NAVIGATION"
  | "FAIL_BUSINESS_ASSERTION"
  | "BLOCKED";

export type LocatorContextInput = {
  locatorDescription: string;
  primaryLocator: string;
  fallbackLocator: string;
  expectedState: string;
  locator: Locator;
};

export type EvidenceContext = {
  step(name: string): void;
  setFailureType(type: EvidenceFailureType): void;
  setLocatorContext(context: LocatorContextInput): void;
  markBlocked(reason: string): void;
  captureCheckpoint(name: string): Promise<string | undefined>;
  captureFailureEvidence(): Promise<EvidenceCaptureResult>;
};

export type EvidenceCaptureResult = {
  caseStatus: "FAIL" | "ERROR" | "BLOCKED" | "PASS" | "SKIPPED";
  runDirectory?: string;
  screenshotStatus: "PASS" | "PASS_FALLBACK" | "ERROR" | "SKIPPED_SENSITIVE" | "UNAVAILABLE";
  tracePath?: string;
};
~~~

Use base.extend<{ evidence: EvidenceContext }> so the fixture receives the existing page fixture and testInfo. Export expect from @playwright/test and export the custom test. The fixture must wrap await use(evidence) in try/finally and call evidence.finalize internally after the test body; finalization must observe testInfo.status and the explicit blocked flag.

- [ ] Step 4: Implement URL/text redaction and capped records

Implement pure helpers inside evidence.ts:
- sanitizeUrl(rawUrl): preserve origin path only as needed and replace query/fragment values for token, access_token, code, session, cookie, authorization, password, pwd, secret, and credential keys with REDACTED.
- redactText(text): replace Bearer values and labeled Authorization, Cookie, Set-Cookie, token, password, secret, and credential values with REDACTED, collapse whitespace, and cap each message at 500 characters.
- pushCapped(array, value, limit): append until the cap and then retain the latest records by removing the oldest entry.

Listeners must store:
- console: type, sanitized text, timestamp, capped at 300;
- pageerror: sanitized message, sanitized stack, timestamp;
- requestfailed: method, sanitized URL, resource type, failure text, timestamp;
- response status >=400: method, sanitized URL, status, duration from a Request start map, resource type, timestamp, and severity warning for 4xx/error for 5xx.

Never call request.postData(), response.body(), request.allHeaders(), or response.allHeaders().

- [ ] Step 5: Implement safe screenshot and checkpoint capture

Use an internal screenshot function:
1. inspect input/textarea metadata without returning values;
2. if a sensitive-looking field has a non-password type, return SKIPPED_SENSITIVE and do not screenshot;
3. try page.screenshot({ path, fullPage: true });
4. on failure, try page.screenshot({ path }) without fullPage;
5. return PASS, PASS_FALLBACK, ERROR, or UNAVAILABLE without throwing over the original test error.

captureCheckpoint(name) writes name.png under the current TestCase/RunId directory, attaches it through testInfo.attach, and does not create failure JSON or summary. The Login Case will call this only for login-page and dashboard-after-login.

- [ ] Step 6: Implement failure Bundle finalization

For a failed/timed-out/interrupted test, or a context marked BLOCKED, create a unique directory under artifacts/web/<TestCaseId>/<RunId>/ and write:
- failure.png;
- page-url.txt with sanitizeUrl(page.url());
- console-errors.json;
- page-errors.json;
- network-errors.json;
- locator-context.json with TestCaseId, CurrentStep, LocatorDescription, PrimaryLocator, FallbackLocator, ExpectedState, ActualLocatorCount, Visible, Enabled, and CurrentUrl;
- failure-summary.md with TestCase, Status, FailureType, FailedStep, Expected, Actual, CurrentURL, Screenshot, Trace, ConsoleErrors, PageErrors, NetworkErrors, and Timestamp.

If the page is closed or screenshot is unavailable, preserve the original status and write the reason. For BLOCKED, write the blocked reason and capture screenshot/URL only when a page exists. Do not generate failure Bundle for an ordinary PASS or SKIPPED without an explicit blocked reason.

Find Trace first from testInfo.attachments entries named trace with a path, then testInfo.outputDir/trace.zip. Attach every generated Bundle file to the Playwright Report with testInfo.attach; attach trace only when a real file exists. Summary must use the actual trace path and may say unavailable when Playwright has not produced one yet.

- [ ] Step 7: Verify the helper with the red self-test

Run:

~~~powershell
npx playwright test tests/web/helpers/evidence-self-test.spec.ts --reporter=list
~~~

Expected: the test intentionally exits non-zero, but artifacts/web/INFRASTRUCTURE_SELF_TEST/<RunId>/ contains non-empty failure.png, console-errors.json, page-errors.json, network-errors.json, locator-context.json, failure-summary.md, and a real trace path or a documented trace-unavailable result. Confirm each file size is greater than zero, the summary contains INFRASTRUCTURE_SELF_TEST, and no file contains a password/token/Cookie/Authorization value.

---

### Task 2: Migrate existing Web Cases to the unified fixture

**Files:**
- Modify: tests/web/environment.spec.ts
- Modify: tests/web/real-project/TC_WEB_LOGIN_001.spec.ts
- Read: tests/web/helpers/evidence.ts and test-cases/TC-WEB-ENV-001.md, test-cases/web/TC-WEB-LOGIN-001.md

**Interfaces:**
- Consumes: custom test/expect/evidence fixture from Task 1.
- Produces: existing Web Cases with common listeners and failure lifecycle while preserving their business assertions.

- [ ] Step 1: Migrate TC-WEB-ENV-001

Change the import to custom test/expect from ../helpers/evidence. Add evidence.step("Open about:blank") before page.goto. Keep the existing URL assertion unchanged. Do not add checkpoints for this trivial environment Case.

- [ ] Step 2: Remove duplicated telemetry from TC-WEB-LOGIN-001

Import test and expect from ../helpers/evidence. Remove its local RuntimeObservation type, URL/text helpers, request/response/console/pageerror listeners, manual runtime-observation.json writing, and manual failure screenshot try/catch. Keep the actual login business response parsing in memory, because the Case must still assert statusCode 200 and isSuccess true without writing the response body.

- [ ] Step 3: Add current-step and locator context calls

Use these exact step names:
- Open login page
- Identify login controls
- Fill username
- Fill password
- Click login
- Wait for Dashboard
- Assert Dashboard root

Before username/password/button visibility assertions, call setLocatorContext with the actual Locator object and source-derived primary/fallback descriptions. Set ERROR_LOCATOR while identifying controls. Before response/business assertions set FAIL_BUSINESS_ASSERTION. Before route/Dashboard assertions set FAIL_UI_NAVIGATION. Call captureCheckpoint("login-page") after the login controls are visible and before filling; call captureCheckpoint("dashboard-after-login") after the Dashboard root assertion. If credentials are absent, call markBlocked("WEB_TEST_USERNAME and WEB_TEST_PASSWORD are required") before test.skip and return.

- [ ] Step 4: Run the focused existing Cases

Run:

~~~powershell
$env:WEB_TEST_USERNAME = (Read-Host "WEB_TEST_USERNAME")
$env:WEB_TEST_PASSWORD = (Read-Host "WEB_TEST_PASSWORD" -AsSecureString | ConvertFrom-SecureString -AsPlainText)
npx playwright test tests/web/environment.spec.ts tests/web/real-project/TC_WEB_LOGIN_001.spec.ts --reporter=list
~~~

Expected: both existing Cases execute with the same business assertions; PASS produces only the Login checkpoint PNGs under a RunId directory and no failure-summary Bundle.

---

### Task 3: Add the repository Web Evidence policy and report

**Files:**
- Modify: README.md
- Create: reports/web-evidence-001-report.md
- Read: .gitignore, playwright.config.ts, docs/superpowers/specs/2026-08-18-web-evidence-design.md

**Interfaces:**
- Consumes: implemented helper, self-test results, existing config, and focused Web regression results.
- Produces: a committed policy and evidence-backed phase report without secrets or generated artifacts.

- [ ] Step 1: Add the formal Web UI evidence rule to README.md

Add a concise Web UI Evidence section stating:
- every automated Web UI FAIL/ERROR includes machine-generated evidence when a browser page was available;
- minimum evidence is screenshot, current URL, failed step, expected vs actual, and Playwright error;
- recommended evidence is trace, console, page errors, and failed/4xx/5xx network records;
- BLOCKED records the reason and captures page screenshot/URL when a page exists;
- screenshot/trace/video defaults remain only-on-failure/retain-on-failure/off;
- artifacts are local ignored evidence and never committed;
- any missing evidence must state why capture was unavailable.

- [ ] Step 2: Write reports/web-evidence-001-report.md

Record:
- starting Git state and preserved unrelated changes;
- current Playwright screenshot/trace/video configuration;
- helper path, Bundle root, RunId format, and whether FAIL/ERROR/BLOCKED capture is automatic;
- screenshot fullPage/fallback/sensitive-input behavior;
- Console, Page Error, requestfailed, 4xx, 5xx, URL redaction, Authorization/Cookie/Token/password handling;
- locator context and no-full-DOM default;
- Playwright attach behavior and UTF-8 JSON;
- Console/network caps;
- TC-WEB-LOGIN-001 integration and current PASS result;
- Infrastructure Evidence Self-Test result for screenshot, Trace, Console, Network, locator context, and summary;
- confirmation temporary self-test was deleted;
- source hash before/after and equality;
- final diff, commit, push, and next recommendation.

Do not paste raw credentials, token values, Cookie headers, request bodies, or large console/network dumps.

---

### Task 4: Verify, remove the self-test, and publish

**Files:**
- Delete: tests/web/helpers/evidence-self-test.spec.ts after verification
- Inspect: all changed helper/spec/README/report files
- Do not stage: artifacts/, playwright-report/, test-results/, or unrelated existing changes

**Interfaces:**
- Consumes: all implementation and evidence report files.
- Produces: a clean, verified Web Evidence commit pushed to origin/main.

- [ ] Step 1: Verify generated evidence files before deletion

Run:

~~~powershell
$bundle = Get-ChildItem -LiteralPath artifacts/web/INFRASTRUCTURE_SELF_TEST -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$required = @("failure.png","console-errors.json","page-errors.json","network-errors.json","locator-context.json","failure-summary.md")
foreach($name in $required) {
  $file = Join-Path $bundle.FullName $name
  if (!(Test-Path -LiteralPath $file) -or (Get-Item -LiteralPath $file).Length -le 0) { throw "Missing or empty evidence: $file" }
}
"EvidenceSelfTestFiles=PASS"
~~~

Inspect JSON with ConvertFrom-Json and assert that no serialized file contains credential markers or token values. Confirm screenshot dimensions/file size and that the Trace path in summary either exists or is explicitly documented unavailable.

- [ ] Step 2: Delete only the temporary self-test source

Use apply_patch to delete tests/web/helpers/evidence-self-test.spec.ts. Do not delete artifacts; they remain ignored local evidence for the report. Do not delete prior unrelated artifacts.

- [ ] Step 3: Re-run normal Web regression

Run:

~~~powershell
npx playwright test tests/web/environment.spec.ts tests/web/real-project/TC_WEB_LOGIN_001.spec.ts --reporter=list
npm test -- --reporter=list
~~~

Expected: both formal Cases PASS in both commands; no self-test is discovered by the default test directory after deletion.

- [ ] Step 4: Recompute source hash with the same Phase WEB-REAL-001 exclusion rules

Run:

~~~powershell
$root='D:\HZ_RSS40\03_trunk\src_m_ui'
$files=Get-ChildItem -LiteralPath $root -Recurse -File -Force | Where-Object { $_.FullName -notmatch '\\(node_modules|dist|build|coverage|\.vscode|\.idea|\.git|\.cache|cache|tmp|temp)(\\|$)' } | Sort-Object FullName
$lines=foreach($f in $files){$h=(Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant(); '{0}|{1}' -f ($f.FullName.Substring($root.Length+1) -replace '\\','/'),$h}
$payload=[Text.Encoding]::UTF8.GetBytes(($lines -join [Environment]::NewLine))
$digest=[Security.Cryptography.SHA256]::Create().ComputeHash($payload)
$hex=([BitConverter]::ToString($digest)).Replace('-','').ToLowerInvariant()
"WebSourceTreeHashAfter=$hex"; "WebSourceFileCountAfter=$($files.Count)"
~~~

Expected: the hash equals the previously recorded Phase WEB-REAL-001 value 9852bd9fbe148f0e8585974989f557cae7498849dde535eec355d175ffff6c18 and file count remains 643.

- [ ] Step 5: Validate, commit, and push only intended files

Run:

~~~powershell
git diff --check
git status --short --branch
git add -- playwright.config.ts tests/web/helpers/evidence.ts tests/web/environment.spec.ts tests/web/real-project/TC_WEB_LOGIN_001.spec.ts README.md reports/web-evidence-001-report.md
git diff --cached --check
git diff --cached --name-only
git grep --cached -n -I -E "Authorization:|Bearer |Cookie:|WEB_TEST_PASSWORD=|storageState|eyJ[A-Za-z0-9_-]{10,}" -- .
~~~

Expected: the staged list contains only intended Web Evidence files, secret scan has no matches, and unrelated dirty files remain unstaged. If playwright.config.ts is unchanged, omit it from git add.

Commit and publish:

~~~powershell
git commit -m "test: add web UI failure evidence capture"
git push origin main
git rev-list --left-right --count origin/main...HEAD
~~~

Expected: commit succeeds, push succeeds, and final sync is 0 0. Do not force push or clean unrelated work.


