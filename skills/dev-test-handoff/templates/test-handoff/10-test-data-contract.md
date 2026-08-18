# Test Data Contract

| FeatureId | Setup | RequiredExistingData | GeneratedTestData | UniqueNaming | SafeTestObject | Cleanup | Dependency | DestructiveOperation | SafeTargetRule | ForbiddenTarget |
|---|---|---|---|---|---|---|---|---|---|---|
| `FEAT-<...>` | `<steps or UNKNOWN>` | `<...>` | `AUTO_TEST_<FEATURE>_<RunId>` | `<rule>` | `<...>` | `<...>` | `<...>` | `YES/NO/UNKNOWN` | `<...>` | `existing/production data` |

Only test-created data may be automatically deleted. If a safe target is not proven, use `BLOCKED_TEST_DATA`.
