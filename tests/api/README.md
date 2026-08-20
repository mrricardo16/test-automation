# API Tests

## PLATFORM-04 Scope

The current API harness uses Playwright `APIRequestContext` and executes only against the test-owned Synthetic Product under `fixtures/synthetic-product/`.

- Runtime: `scripts/platform/synthetic-runtime.mjs`
- Address: dynamic `RuntimeHandle.apiBaseUrl` on `127.0.0.1`; no hardcoded port
- Lifecycle: `ownedProcess=true`, health check before tests, reset between cases, verified shutdown after tests
- TestCase-first: every formal API spec has a corresponding `TC-SYN-API-*` record
- Canonical results: PLATFORM-01 `ExecutionStatus`, `ApplicabilityStatus`, `CoverageStatus`, `ExpectedBasis`, `EvidenceIds`, and `GateStatus`
- Evidence: sanitized summaries under ignored `projects/<project-slug>/artifacts/api/<TestCaseId>/<RunId>/`

## Current Coverage

The first harness covers Synthetic CRUD, authentication/authorization, validation and business boundaries, HTTP 400/401/403/404/409/500 contracts, data consistency, feature flags, and the known product defect contract.

Real project APIs are not configured or executed. This is not real product API acceptance, and no real business localhost, source, DLL, database, credentials, or device is used.

Run the Synthetic API suite with:

```text
npx playwright test --config=tests/api/synthetic/playwright.config.ts --reporter=line
```
