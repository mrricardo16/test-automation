# TC-WEB-LOGIN-001

| Field | Value |
| --- | --- |
| TestCaseId | TC-WEB-LOGIN-001 |
| Module | WEB |
| Title | Real login smoke enters Dashboard |
| Priority | P0 |
| TestType | UI |
| Preconditions | `http://localhost:8223` is reachable; backend services required by login are running; Chromium is available; approved credentials are supplied through `WEB_TEST_USERNAME` and `WEB_TEST_PASSWORD` |
| TestData | Username from `WEB_TEST_USERNAME`; password from `WEB_TEST_PASSWORD`; local approved test credential, value not stored in Git |
| Steps | Open `#/login?redirect=/dashboard`; verify username/password fields and login button; fill both fields with environment values; click login; observe login response; wait for route and Dashboard root; inspect Console and Network failures |
| ExpectedResult | Real UI input and click complete successfully; `POST /Account/Login` returns a successful business response; the final route is the source-defined Dashboard route; a stable Dashboard root or heading is visible; no critical console/page error or HTTP 5xx blocks the entry |
| AutomationType | AUTO |
| AutomationFramework | Playwright Test + Chromium |
| LocatorStrategy | Role and placeholder first, then stable source-defined CSS only if required; no coordinate clicks, direct DOM value assignment, or injected test ids |
| RequirementSource | Phase WEB-REAL-001 approved design and attached phase request |
| SourceCodeReference | `src/views/login/index.vue`; `src/views/dashboard/index.vue`; `src/router/index.ts`; `src/api/auth/index.ts`; `src/utils/request.ts`; `src/utils/auth.ts`; `src/store/modules/user.ts`; `src/plugins/permission.ts` in the read-only real source |
| Evidence | `projects/test-workflow/artifacts/web-real-001/login-page.png`; `projects/test-workflow/artifacts/web-real-001/dashboard-after-login.png`; failure screenshot/trace only when generated; sanitized runtime details in `projects/test-workflow/reports/web-real-001-report.md` |
| Cleanup | Close the test BrowserContext; do not persist cookies, storage state, tokens, or credentials |
| Limitations | Valid login only; no invalid credentials, logout, permissions, menu navigation, map, AGV, orders, dispatching, settings, or pixel-level visual acceptance |
| Notes | Executable mapping: `tests/web/real-project/TC_WEB_LOGIN_001.spec.ts` |
