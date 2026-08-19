# Test data and cleanup

Name created data `AUTO_TEST_<FEATURE>_<RunId>`. Clean up only data created by the current test. Delete, Disable, Reset, Clear, Permission Change, or irreversible state needs Safe Environment, Safe Target, Test-created, and Cleanup Known. If any is absent, use `BLOCKED_TEST_DATA`; never target production/field data, devices, or external systems. Record cleanup separately so `ERROR_CLEANUP` does not overwrite the original case result.
