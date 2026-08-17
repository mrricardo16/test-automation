# Avalonia Test Cases

Avalonia TestCase records use the repository-wide TestCase convention:

- TestCaseId
- Module
- Title
- Priority
- TestType
- Preconditions
- Steps
- ExpectedResult
- AutomationType
- AutomationFramework
- RequirementSource
- SourceCodeReference
- Notes

AutomationType remains AUTO, AUTO_PARTIAL, or MANUAL. Every formal Avalonia test must be written in this directory before its executable test is created.

Phase 2B assessment classifications are recorded separately in the matrix report and may use `AUTO_UNIT`, `AUTO_HEADLESS`, `AUTO_HEADLESS_WITH_MOCK`, `NEEDS_APPIUM`, `MANUAL`, `BLOCKED`, or `PRODUCT_CHANGE_RECOMMENDED`. A classification is not an execution result.
