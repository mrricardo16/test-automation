# Evidence rules

Create an evidence bundle for each executed TestCase. Suggested Web path: `artifacts/web/<TestCaseId>/<RunId>/`; use equivalent API and Manual paths.

## Web

On failure preserve a screenshot, current URL, failed step, Expected, Actual, Playwright error, and TestCaseId. Retain a trace on failure when available. Console and network evidence is recommended when it explains the result. Warnings, favicon 404, and unrelated console noise do not automatically fail a case.

## API

Record method, path, status, Expected, Actual, duration, sanitized response summary, and TestCaseId. Do not retain Authorization, cookies, tokens, private headers, or unsanitized sensitive payloads.

## Manual

Keep status `MANUAL` and record steps, Expected, required evidence, environment, reason automation is not approved, and reviewer/result fields. Do not silently convert a missing manual observation to PASS.

## Index

`evidence-index.md` maps every TestCaseId to status, screenshot, trace, console, network, and other evidence. Cleanup or evidence-capture errors are secondary results and must not overwrite the original product result.
