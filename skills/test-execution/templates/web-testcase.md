# Web TestCase

- TestCaseId: `TC-WEB-`
- ModuleId:
- FeatureId:
- Title:
- Priority: P0 / P1 / P2 / P3
- TestType: functional / boundary / permission / error-path / regression
- Covers: Handoff IDs
- Preconditions:
- TestData: `AUTO_TEST_<FEATURE>_<RunId>` or approved fixture
- Steps:
  1. Open the approved runtime entry point and perform the documented user action.
- ExpectedResult:
- AutomationType: Playwright
- Environment:
- EvidenceRequirement: screenshot/trace on failure; URL, step, Expected, Actual, error
- Cleanup:
- Status: BLOCKED
- Limitations:
- LocatorStability: strong / weak
