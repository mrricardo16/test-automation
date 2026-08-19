# Runtime health and error taxonomy

Before formal execution verify Web reachability, API reachability, approved browser, credentials, required services, test data, and output/evidence writability. Save environment findings in `environment-issues.md`.

Use `BLOCKED` for a missing prerequisite such as endpoint, browser, credential, service, safe target, or approved package. Use `ERROR` when the automation or harness fails after prerequisites are present. Use `FAIL` only when a real interaction completed and the product result contradicted Expected.

Supported technical reasons are `ERROR_LOCATOR`, `ERROR_TIMEOUT`, `ERROR_NAVIGATION`, `ERROR_BROWSER`, `ERROR_PLAYWRIGHT`, `ERROR_API_HARNESS`, `ERROR_TEST_DATA_SETUP`, `ERROR_CLEANUP`, and `ERROR_EVIDENCE_CAPTURE`. Record the original TestCase result separately from cleanup/evidence errors.

The health check does not prove business behavior. A successful page load or constructor smoke is not a regression PASS.
