# Phase WEB-REAL-001 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Add and execute a real Playwright login smoke for src_m_ui that starts from /login?redirect=/dashboard, performs real user input, and objectively verifies Dashboard entry without modifying product source.

**Architecture:** Reuse the existing @playwright/test project and Chromium configuration. Add one TestCase record before the executable test, then add one independently runnable TypeScript spec under tests/web/real-project/. The spec reads credentials from process environment, uses a fresh browser context, captures sanitized runtime telemetry and screenshots, and leaves the committed report to record the observed result.

**Tech Stack:** Playwright Test @playwright/test ^1.62.1, Chromium, TypeScript, PowerShell, Git, Vue 3/Vite source analysis.

## Global Constraints

- D:\HZ_RSS40\03_trunk\src_m_ui is read-only for the entire phase.
- Only E:\automated-testing may receive test code, reports, TestCases, scripts, and evidence.
- Do not add data-testid, change product source, install/update product dependencies, or start another Web instance when localhost:8223 is reachable.
- Create/update test-cases/web/TC-WEB-LOGIN-001.md before writing the formal test.
- Keep TestCaseId TC-WEB-LOGIN-001 in the executable test title and report.
- Read WEB_TEST_USERNAME, WEB_TEST_PASSWORD, and optional WEB_TEST_BASE_URL from the process environment; do not commit credential values.
- Use only PASS, FAIL, ERROR, BLOCKED, MANUAL, and SKIPPED.
- Prefer role, label, placeholder, text, stable name/id, existing test id, stable CSS, XPath, then coordinates; do not use coordinates or nth-child in the formal locator strategy.
- Use a new BrowserContext, real fill() and click(), condition-based waits, and no direct DOM value assignment or large fixed sleeps.
- Keep generated reports under reports and evidence under ignored artifacts; never commit screenshots, traces, cookies, tokens, or storage state.
- Preserve all existing uncommitted Phase 3B files and do not include them in the Web commit.
- Before completion, run UTF-8 validation, git diff --check, secret-pattern scanning, source hash before/after, Web regression, and remote synchronization checks.

---

### Task 1: Record the formal Web Login TestCase

**Files:**
- Create: test-cases/web/TC-WEB-LOGIN-001.md
- Read: test-cases/TC-WEB-ENV-001.md, test-cases/README.md, docs/superpowers/specs/2026-08-18-phase-web-real-001-design.md

**Interfaces:**
- Consumes: approved Phase WEB-REAL-001 design and source findings for /login, /dashboard, and POST /Account/Login.
- Produces: a stable TestCase record whose TestCaseId is used verbatim by the later Playwright test and report.

- [ ] Step 1: Write the TestCase record before automation code

Create a Markdown table containing TestCaseId, Module WEB, Title Real login smoke enters Dashboard, Priority P0, TestType UI, environment and credential preconditions, TestData sourced from WEB_TEST_USERNAME and WEB_TEST_PASSWORD without the values, ordered login steps, ExpectedResult, AutomationType AUTO, AutomationFramework Playwright Test + Chromium, locator strategy, requirement source, the eight source references, evidence paths, cleanup, limitations, and executable mapping to tests/web/real-project/TC_WEB_LOGIN_001.spec.ts.

- [ ] Step 2: Validate the record before writing the spec

Run:

~~~powershell
git diff --check -- test-cases/web/TC-WEB-LOGIN-001.md
$b = [IO.File]::ReadAllBytes((Resolve-Path 'test-cases/web/TC-WEB-LOGIN-001.md'))
$utf8 = New-Object Text.UTF8Encoding($false, $true)
[void]$utf8.GetString($b)
~~~

Expected: no diff-check output and no UTF-8 decoding exception.

---

### Task 2: Implement the independently runnable Playwright Login Smoke

**Files:**
- Create: tests/web/real-project/TC_WEB_LOGIN_001.spec.ts
- Read: playwright.config.ts, tests/web/environment.spec.ts, and the source paths from Task 1

**Interfaces:**
- Consumes: TC-WEB-LOGIN-001, WEB_TEST_BASE_URL, WEB_TEST_USERNAME, WEB_TEST_PASSWORD, and the currently running Web application.
- Produces: an executable Playwright test with sanitized in-memory telemetry and screenshots at artifacts/web-real-001/.

- [ ] Step 1: Add environment and telemetry helpers

Define baseUrl from WEB_TEST_BASE_URL with default http://localhost:8223, construct the hash login URL without credentials, and define evidenceDir as artifacts/web-real-001. Add safePath(rawUrl) that returns only pathname and query values with token, password, pwd, and cookie values replaced by redacted.

Use a request-start map and page.on("response") to record only login method/path/status/duration. Store request failures and 5xx responses as booleans plus safe paths. Store console.error as a short type/message classification and pageerror as a sanitized name/message. Never include headers, request bodies, response bodies, cookies, tokens, or passwords.

- [ ] Step 2: Create a fresh context and capture the login page

The test title must contain TC-WEB-LOGIN-001. If credentials are absent, use Playwright skip with reason BLOCKED: WEB_TEST_USERNAME and WEB_TEST_PASSWORD are required; with the supplied shell environment the formal run must execute.

Create await browser.newContext(), attach listeners before navigation, call page.goto(loginUrl, { waitUntil: "domcontentloaded" }), and verify the real username input, password input, and login button are visible. Prefer the source-defined localized placeholders and getByRole("button", { name: /登录|login/i }). Save login-page.png before filling the password. Close the context in finally.

Do not use page.evaluate to set input values, coordinate clicks, nth-child, or fixed sleeps. If the runtime DOM does not match the source-derived locator map, preserve DOM/screenshot evidence and classify ERROR_LOCATOR or SOURCE_RUNTIME_MISMATCH rather than weakening the locator.

- [ ] Step 3: Add real fill/click, response wait, route wait, and Dashboard assertions

Use this sequence after visibility checks:

~~~typescript
await usernameInput.fill(username);
await passwordInput.fill(password);
const loginResponsePromise = page.waitForResponse(
  (response) =>
    response.request().method() === "POST" &&
    /\/Account\/Login(?:$|\?)/i.test(response.url()),
  { timeout: 30_000 },
);
await loginButton.click();
const loginResponse = await loginResponsePromise;
expect(loginResponse.status()).toBeGreaterThanOrEqual(200);
expect(loginResponse.status()).toBeLessThan(300);
await expect(page.locator(".dashboard")).toBeVisible({ timeout: 30_000 });
await page.screenshot({ path: path.join(evidenceDir, "dashboard-after-login.png"), fullPage: true });
~~~

Parse the login response only enough to determine source-defined business success (statusCode 200 and isSuccess true after the Axios contract) without printing the body. Verify final route against the observed source behavior: login calls router.replace("/"), and the root route redirects to /dashboard. Verify token existence only as a Boolean from sessionStorage.getItem("access_token"); write only Yes, No, or Not Applicable to the report.

- [ ] Step 4: Run the single test for real

Run with credentials set only in the current PowerShell process:

~~~powershell
# Set WEB_TEST_USERNAME and WEB_TEST_PASSWORD only in the current PowerShell process.
npx playwright test tests/web/real-project/TC_WEB_LOGIN_001.spec.ts --reporter=list
~~~

Expected: the real test executes; a passing run creates login-page.png and dashboard-after-login.png; a non-passing run preserves available screenshot/trace evidence and is classified from the actual cause. Do not put values in a file or committed command.

---

### Task 3: Execute the environment gate and real Login Smoke

**Files:**
- Read: tests/web/environment.spec.ts, playwright.config.ts
- Generate ignored: artifacts/web-real-001/, reports/playwright-report/, artifacts/test-results/

**Interfaces:**
- Consumes: the TestCase and spec from Tasks 1-2, reachable runtime, Chromium, and current-shell credentials.
- Produces: objective results for TC-WEB-ENV-001 and TC-WEB-LOGIN-001, plus preserved screenshots/traces/log output.

- [ ] Step 1: Confirm runtime before starting another process

Run:

~~~powershell
try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8223/' -TimeoutSec 10; "HTTP=$($response.StatusCode)" } catch { "HTTP_ERROR=$($_.Exception.Message)" }
Test-NetConnection -ComputerName localhost -Port 8223 -InformationLevel Quiet
~~~

Expected: an HTTP response or reachable TCP port. If unreachable, inspect only source package.json and Vite configuration for the documented command; do not guess or change its port. If reachable, do not launch a duplicate instance.

- [ ] Step 2: Run existing environment case first

Run:

~~~powershell
npx playwright test tests/web/environment.spec.ts --reporter=list
~~~

Expected: TC-WEB-ENV-001 is PASS. If not PASS, stop before the login case and record ERROR or BLOCKED from the actual prerequisite cause.

- [ ] Step 3: Run Login Smoke

Run:

~~~powershell
# Set WEB_TEST_USERNAME and WEB_TEST_PASSWORD only in the current PowerShell process.
npx playwright test tests/web/real-project/TC_WEB_LOGIN_001.spec.ts --reporter=list
~~~

Expected: output names TC-WEB-LOGIN-001 and the observed result is exactly PASS, FAIL, ERROR, or BLOCKED. If login is 401/403, record status and backend/account evidence without automatically calling it a product bug. If response is successful but Dashboard does not appear, classify FAIL_UI_NAVIGATION after checking route and API evidence.

- [ ] Step 4: Run Web regression together

Run:

~~~powershell
npx playwright test tests/web/environment.spec.ts tests/web/real-project/TC_WEB_LOGIN_001.spec.ts --reporter=list
~~~

Expected: both cases execute in one run with no prior login cache.

---

### Task 4: Generate the phase reports and future candidate record

**Files:**
- Create: reports/web-real-001-report.md
- Create: reports/future-web-candidates.md
- Read: TestCase, execution output, and ignored evidence

**Interfaces:**
- Consumes: static source findings, runtime DOM/Network/Console observations, TestCase status, screenshots/traces, and before/after source hashes.
- Produces: an evidence-backed report with no sensitive values and a non-executed future candidate list.

- [ ] Step 1: Write exact observed report fields

Include starting Git status and origin/main...HEAD; WebSourceTreeHashBefore=9852bd9fbe148f0e8585974989f557cae7498849dde535eec355d175ffff6c18; WebSourceFileCountBefore=643; detected Framework/Build Tool/Router/State Management/HTTP Client/UI Library; login, Dashboard, router, API, auth utility and user-store source paths; POST /Account/Login; sessionStorage token mechanism; whether redirect=/dashboard was consumed; runtime reachability and startup decision; both TestCase results; locator mapping; fill/click/direct-DOM-value answers; login response status; final URL/route; Dashboard assertion; Console/pageerror/requestfailed/5xx results; token existence only as Yes, No, or Not Applicable; screenshot/trace presence; hash after/count after/equality; source modification answer; password/token/Cookie scan; commit/push data; and explicit “No other Dashboard business module entered” boundary.

- [ ] Step 2: Add locator mapping

Use exactly these rows: Login Username, Login Password, Login Button, Dashboard Root. Each row records preferred locator, fallback locator, STRONG/MEDIUM/WEAK, and source reference. State when a locator relies on localized placeholder or source-defined CSS. Do not claim visual fidelity or broad Dashboard business coverage from a root-container assertion.

- [ ] Step 3: Add future candidates without executing them

Create a short table containing only invalid login, required-field validation, logout, route guard, permission test, and Dashboard API error handling. Mark every item Not executed and state that each is outside WEB-REAL-001.

- [ ] Step 4: Validate report safety

Run:

~~~powershell
rg -n "WEB_TEST_PASSWORD=|Authorization:|Bearer |Cookie:|storageState" reports test-cases tests --glob '!**/node_modules/**'
~~~

Expected: no password, token value, Cookie, Authorization header, or storage-state content appears in new tracked files. Generic source-reference terms such as access_token are allowed only as a storage-key description, never as a secret value.

---

### Task 5: Verify source integrity, repository safety, and Git publication

**Files:**
- Read-only verify: D:\HZ_RSS40\03_trunk\src_m_ui
- Inspect: new TestCase, spec, reports, and plan/spec files
- Do not stage: existing Phase 3B modified/untracked files

**Interfaces:**
- Consumes: all new Web deliverables and the recorded execution result.
- Produces: a verified commit on main, successful git push origin main, and remote synchronization 0 0, provided Login has an explicit result and all safety gates pass.

- [ ] Step 1: Recompute source tree hash with identical exclusions

Run before and after execution with the same exclusion expression:

~~~powershell
$root='D:\HZ_RSS40\03_trunk\src_m_ui'
$files=Get-ChildItem -LiteralPath $root -Recurse -File -Force | Where-Object { $_.FullName -notmatch '\\(node_modules|dist|build|coverage|\.vscode|\.idea|\.git|\.cache|cache|tmp|temp)(\\|$)' } | Sort-Object FullName
$lines=foreach($f in $files){$h=(Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant(); '{0}|{1}' -f ($f.FullName.Substring($root.Length+1) -replace '\\','/'),$h}
$payload=[Text.Encoding]::UTF8.GetBytes(($lines -join [Environment]::NewLine))
$digest=[Security.Cryptography.SHA256]::Create().ComputeHash($payload)
$hex=([BitConverter]::ToString($digest)).Replace('-','').ToLowerInvariant()
"Hash=$hex"; "Count=$($files.Count)"
~~~

Expected after: hash equals 9852bd9fbe148f0e8585974989f557cae7498849dde535eec355d175ffff6c18 and count equals 643. If not, stop and investigate; do not hide the mismatch.

- [ ] Step 2: Validate repository diff and encoding

Run:

~~~powershell
git status --short --branch
git diff --check
git diff --stat -- test-cases/web tests/web/real-project reports docs/superpowers/plans/2026-08-18-phase-web-real-001.md
git diff -- 'D:\HZ_RSS40\03_trunk\src_m_ui'
~~~

Expected: no diff under the real product path, no whitespace errors, and only intended Web files shown by the path-filtered diff. Use the strict UTF-8 decoder on every new Markdown and TypeScript file before staging.

- [ ] Step 3: Stage only phase Web files

Run with explicit paths, never git add .:

~~~powershell
git add -- test-cases/web/TC-WEB-LOGIN-001.md tests/web/real-project/TC_WEB_LOGIN_001.spec.ts reports/web-real-001-report.md reports/future-web-candidates.md
git diff --cached --check
git diff --cached --name-only
~~~

Expected: exactly four phase deliverables are staged; existing Avalonia changes remain unstaged.

- [ ] Step 4: Commit with a result-appropriate message

If Login is PASS:

~~~powershell
git commit -m "test: add real web login smoke coverage"
~~~

If Login is BLOCKED, FAIL, or ERROR:

~~~powershell
git commit -m "test: add real web login smoke harness"
~~~

Expected: a new commit containing only staged Web files. Do not amend or rewrite the earlier design commit and do not stage unrelated work.

- [ ] Step 5: Push and verify remote synchronization

Run only after explicit result, source hash equality, safety scan, and commit succeed:

~~~powershell
git push origin main
git rev-list --left-right --count origin/main...HEAD
git status --short --branch
~~~

Expected: push succeeds, ahead/behind output is 0 0, and the branch is synchronized. Existing unrelated work may remain in the working tree and must be reported as preserved rather than silently cleaned.
