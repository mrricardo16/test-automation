# TC-PLATFORM-09-TESTCASE-V2-001

| Field | Value |
|---|---|
| TestCaseId | TC-PLATFORM-09-TESTCASE-V2-001 |
| CaseKind | COMPOSITE |
| ModuleId | PLATFORM |
| FeatureId | TESTCASE-GENERATION-V2 |
| Title | Validate V2 TestCase generation governance with synthetic fixtures |
| Priority | P0 |
| TestType | Contract / Governance |
| TestLayer | CONTRACT |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | DESIGN |
| Objective | Prove that V2 lifecycle composites and AUTO/MANUAL safety gates are enforced without accessing a real product. |
| PrimaryAssertion | Valid lifecycle fixtures are accepted and unsafe or incomplete fixtures receive the specified validation issue. |
| AutomationType | AUTO |
| AutomationEligibility | AUTO_ALLOWED |
| AutomationFramework | Playwright Test + Python self-test |
| LifecycleStatus | ACTIVE |
| ReviewGateStatus | PASS |
| RiskLevel | RISK_LOW |
| SideEffects | TEST_DATA_CREATE |
| SideEffectScope | TEST_OWNED |
| Reversibility | CLEANUP_REVERSIBLE |
| DataOwnership | TEST_OWNED |
| InteractionMode | UNATTENDED |

## InitialState

Only repository-owned synthetic objects exist; no real runtime, source tree, account, credential, service, or business data is used.

ScenarioSuiteId: `SS-SYN-V2-001`

Preconditions: The synthetic fixture is isolated and test-owned.

TestData: `synthetic-owned-resource`

## Synthetic Lifecycle Acceptance Fixture

Resource fields: `id`, `name`, `status`, `parentId`.

Rules: create allowed; read existing; update existing; delete removes the resource; name is unique; a deleted name is reusable only when the Expected rule is explicitly defined; disabled resources cannot update; a parent with children cannot be deleted.

Roles: `Viewer` can read; `Editor` can read/create/update; `Admin` can read/create/update/delete/enable/disable.

## Steps and ExpectedPerStep

1. Validate synthetic `CREATE→READ`, `DELETE→READ`, `DELETE→RECREATE`, `DELETE→UPDATE`, `DELETE→DELETE`, `DISABLE→UPDATE`, and parent-child integrity composites.
   - Expected: every complete V2 fixture has no validation issues.
2. Validate fixtures with missing composite fields, unknown risk, irreversible AUTO operation, interactive AUTO flow, multiple independent objectives, and missing Expected.
   - Expected: each fixture receives its dedicated governance issue and is not eligible for unattended AUTO execution.
3. Validate the V2 JSON Schemas and a legacy TestCase.
   - Expected: V2 records obey conditional rules while the historical TestCase shape remains accepted.

## StateTransitions

- `SYNTHETIC_EMPTY --CREATE--> SYNTHETIC_PRESENT`
- `SYNTHETIC_PRESENT --DELETE--> SYNTHETIC_ABSENT`
- `SYNTHETIC_DISABLED --UPDATE_ATTEMPT--> SYNTHETIC_DISABLED`

## Intermediate Assertions

- Each intermediate state is observable before the final assertion.

## CrossStepInvariants

- No state outside the synthetic fixture changes.

## PostConditions

- No external state changed.
- All temporary synthetic state is absent.
- Validation results are deterministic.

## Cleanup

Dispose only temporary synthetic fixtures created by the test process.

## CleanupVerification

Assert that the temporary fixture root no longer exists and no external endpoint or product path was opened.
