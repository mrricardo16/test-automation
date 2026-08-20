# Execution rules

## TestCase-first

The order is Handoff → Coverage → TestCase → Review Gate → Automation or Manual execution. Each formal automated test must reference a unique TestCaseId in its method name, metadata, or report.

## Review gate

Before execution, verify P0/P1 Expected Result, Preconditions, Test Data, Cleanup, destructive safety, Automation Layer, Environment, and Evidence Requirement. A missing item is `BLOCKED` with a precise blocker reason.

## Layers

Use `WEB_UI`, `API`, `BOTH`, or `MANUAL`. Prefer Playwright for Web UI and the existing HTTP/API harness for API. Use Manual when automation is unreliable or the required behavior is visual, native-shell, or otherwise outside the approved layer. Do not force unreliable automation to PASS.

## Web locators

Prefer role, label, placeholder, existing test id, stable visible text, stable id/name, then stable CSS. Runtime DOM is authoritative. Record weak locator risk and `PRODUCT_CHANGE_RECOMMENDED`; never modify the product to add a locator.

## Interactions

Perform real user-visible interactions. Use Playwright auto-waiting and condition-based waits. Do not use coordinate clicks, DOM-state hacks, direct business-state JavaScript, token bypass, absolute XPath, `nth-child`, index-only selectors, or large fixed sleeps. Use `setInputFiles` for uploads.

## API and statuses

Final `ExecutionStatus` values are `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, and `SKIPPED`. `NOT_APPLICABLE` is an `ApplicabilityStatus`/`CoverageStatus` value, not an execution status. `LegacyFieldAdapter` maps historical values without rewriting them.

API tests use `06-api-contracts.md`. PASS and FAIL require actual execution and evidence. Setup/infrastructure problems are ERROR or BLOCKED; missing Expected or safe data is not a product FAIL.
