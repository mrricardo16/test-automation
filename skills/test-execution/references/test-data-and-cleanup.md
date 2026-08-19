# Test data and cleanup

Use an isolated, approved test environment. Name generated data `AUTO_TEST_<FEATURE>_<RunId>` and record ownership, creation, and cleanup evidence. Use only data created by the current test run unless the Handoff explicitly supplies safe fixtures.

Destructive operations require a safe target, explicit scope, rollback/cleanup plan, and verified cleanup. If any prerequisite is absent, classify the case `BLOCKED` with reason `BLOCKED_TEST_DATA`.

Credentials belong in environment variables, ignored local configuration, or an approved secret store. They never belong in TestCases, reports, screenshots, traces, logs, URLs, or commits.

Only processes started by the current run may be stopped. Record each owned PID and close only those PIDs. Never use broad process-name termination.

Cleanup failures use `ERROR_CLEANUP` as a secondary error while preserving the original TestCase result. Report remaining test data and the safe manual cleanup action.
