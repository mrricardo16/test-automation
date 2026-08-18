# Phase WEB-REAL-001 Report

## Scope and starting state

| Field | Result |
| --- | --- |
| Source path | `D:\HZ_RSS40\03_trunk\src_m_ui` (read-only) |
| Runtime URL | `http://localhost:8223/#/login?redirect=/dashboard` |
| GitStatusBefore | `main...origin/main`; existing Phase 3B work was modified/untracked and preserved |
| ExistingUncommittedChanges | Preserved: `config/local-projects.example.json`, `reports/real-avalonia-phase3b-report.md`, `test-cases/avalonia/TC-AVA-E2E-001.md`, `test-cases/avalonia/TC-AVA-E2E-ENV-001.md`, `tests/avalonia/e2e/README.md`, `tests/avalonia/e2e/appium/TC_AVA_E2E_001_RealLogImport.spec.mjs`, `tests/avalonia/e2e/helpers/appium-session.mjs`, `tests/avalonia/e2e/helpers/evidence.mjs`, `tests/avalonia/e2e/helpers/project-config.mjs`, `tests/avalonia/e2e/helpers/real-app-process.mjs`, plus existing Phase 3B untracked files |
| origin/main...HEAD before phase | `0 0` |
| WebSourceTreeHashBefore | `9852bd9fbe148f0e8585974989f557cae7498849dde535eec355d175ffff6c18` |
| WebSourceFileCountBefore | `643` |

## DetectedFromSource

| Item | Evidence-backed result |
| --- | --- |
| Framework | Vue 3 + TypeScript; `src/main.ts:1,12` creates the Vue app |
| Build Tool | Vite; `package.json:7-10,154` and `vite.config.ts` |
| Router | Vue Router 4.5.0 with `createWebHashHistory`; `src/router/index.ts:2,20-21,37-43,112` |
| State Management | Pinia is active through `src/store/index.ts:2,4` and `defineStore` modules; Vuex is only a package dependency in the inspected flow |
| HTTP Client | Axios; `src/utils/request.ts:1,10-22` |
| UI Component Library | Element Plus; `package.json:74` and `src/main.ts:5`, with `el-input`, `el-button`, and `el-form` in the login view |
| Login page | `src/views/login/index.vue:1-114` |
| Dashboard page | `src/views/dashboard/index.vue:1-8,22-35` |
| Router guard | `src/plugins/permission.ts:9-20,75-80` |
| Login API source | `src/api/auth/index.ts:3,8-18` |
| Request base URL | `src/utils/request.ts:10-11` reads `window.RssConfig.RSSApi`; `public/config.js:1-3` supplies the runtime API base |
| Authentication storage | `src/utils/auth.ts:2-19` uses `sessionStorage` keys `access_token` and `refresh_token`; `src/store/modules/user.ts:29-37` stores the returned token |

## Router and redirect analysis

The login component calls `router.replace("/")` after login and user-info loading (`src/views/login/index.vue:267-274`). The root route redirects to `/dashboard` and mounts `src/views/dashboard/index.vue` (`src/router/index.ts:37-43`). The query value `redirect=/dashboard` is not directly read by the valid-login component; the guard uses a redirect query when sending an unauthenticated route to `/login` (`src/plugins/permission.ts:75-80`). In the real run, the final route was `#/dashboard`, which matches the source-defined root redirect.

## Login API

| Field | Observed/source result |
| --- | --- |
| Method | `POST` |
| Source path | `/Account/Login` |
| Runtime path | `/api/Account/Login` |
| Request contract | JSON body with `userCode` and `userPwd`; source `src/api/auth/index.ts:8-18` |
| Response success contract | Axios unwraps a response with `statusCode === 200` and `isSuccess === true`; login store reads `data.data.token` |
| Runtime result | `POST /api/Account/Login`, HTTP `200`, duration `63 ms`, business success `true` |
| Token result | `AuthTokenPresent = Yes`; token value was not read into output or report |

## Locator mapping

| Element | Preferred locator | Fallback locator | Stability | Source reference |
| --- | --- | --- | --- | --- |
| Login Username | `getByPlaceholder(/用户名|username|loginName/i)` | `.login-form input` matching the first source input | MEDIUM; localized placeholder and blank form label | `src/views/login/index.vue:87-95` |
| Login Password | `getByPlaceholder(/用户密码|密码|password/i)` | `.login-form input[type="password"]` | MEDIUM; localized placeholder, password type is source-stable | `src/views/login/index.vue:97-105` |
| Login Button | `getByRole("button").filter({ hasText: /登\s*录|login/i })` | `button.el-button--primary` | MEDIUM; role is stable, runtime Chinese text contains an internal space | `src/views/login/index.vue:111-114` |
| Dashboard Root | `locator(".dashboard")` | `getByRole("heading")` for the source Dashboard heading | MEDIUM; source-defined root class, no product test id | `src/views/dashboard/index.vue:2,8` |

The initial role-only name locator was corrected after inspecting the real DOM: the button accessible text rendered as `登 录`, so a continuous `登录` regex did not match. No product locator or `data-testid` was added.

## Execution result

| Check | Result |
| --- | --- |
| localhost:8223 reachable | Yes; `Invoke-WebRequest` returned HTTP 200 and TCP check returned `True` |
| Started Web service | No; existing runtime was reused |
| TC-WEB-ENV-001 | PASS |
| Login page loaded | Yes; username, password, and button were visible; password input had `type=password` |
| Real Playwright fill | Yes |
| Real Playwright click | Yes |
| Direct DOM value assignment | No |
| Login request observed | Yes |
| Login request method/path | `POST /api/Account/Login` |
| Login HTTP status | `200` |
| Login succeeded | Yes; source business contract matched |
| Final URL / route | `http://localhost:8223/#/dashboard` / `#/dashboard` |
| Dashboard entered | Yes |
| Dashboard assertion | `.dashboard` visible; source heading rendered as Dashboard overview |
| Critical Console Error | No `console.error` event observed |
| Unhandled Page Error | Yes: `Unknown column 'cn_n_car_id' in 'field list'` during Dashboard first-screen loading. This is preserved as a product/backend evidence item; it did not prevent the Dashboard root from rendering. |
| Key Request Failed | No |
| HTTP 5xx | No |
| Auth Token | Yes, presence only; value withheld |
| TC-WEB-LOGIN-001 | PASS for valid login and Dashboard Entry; see the separate Dashboard page-error observation above |
| Screenshot | Yes: `artifacts/web-real-001/login-page.png`, `dashboard-after-login.png`; initial locator-failure evidence is also retained |
| Trace | Yes, retained by existing `trace: retain-on-failure` from the initial locator diagnosis; final successful run required no failure trace |
| Other Dashboard modules entered | No |

The first implementation run produced a locator `ERROR` because the runtime button text contained an internal whitespace. After the evidence-backed locator correction, the focused case passed and the combined Web regression passed.

## Future Web candidates (not executed)

See `reports/future-web-candidates.md`. This phase stopped at Dashboard Entry and did not execute any further business module.

## Integrity and safety

| Check | Result |
| --- | --- |
| Web source modified | No |
| Username written to Git | No; read from `WEB_TEST_USERNAME` |
| Password written to Git | No; read from `WEB_TEST_PASSWORD` |
| Token/Cookie/Authorization leakage | No observed in tracked phase files or sanitized runtime observation |
| Evidence location | `artifacts/web-real-001/` and Playwright test results; ignored by repository `.gitignore` |
| Commit hash | Recorded in the final handoff after publication |
| Commit message | Result-appropriate Web phase commit, recorded in the final handoff |
| Push | Recorded in the final handoff after publication |

## Phase status

The Login Smoke and Dashboard Entry acceptance are objectively `PASS`. The phase also records one unhandled Dashboard page error from the real environment; this is not suppressed, and no product source was changed. Phase WEB-REAL-001 stops here as requested.
