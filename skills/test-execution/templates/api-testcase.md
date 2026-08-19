# API TestCase

- TestCaseId: `TC-API-`
- ModuleId:
- FeatureId:
- Title:
- Priority: P0 / P1 / P2 / P3
- TestType: contract / functional / boundary / error-path
- Covers: Handoff IDs and API contract section
- Preconditions:
- TestData: `AUTO_TEST_<FEATURE>_<RunId>` or approved fixture
- Steps:
  1. Method and path from `06-api-contracts.md`
- ExpectedResult: status, response contract, and side effects
- AutomationType: existing API/HTTP harness
- Environment:
- EvidenceRequirement: method, path, status, duration, sanitized response summary
- Cleanup:
- Status: BLOCKED
- Limitations:
