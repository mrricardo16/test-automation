# Composite TestCase

- TestCaseId: `TC-WEB-` / `TC-API-` / `TC-MANUAL-`
- CaseKind: COMPOSITE
- ScenarioSuiteId:
- ModuleId / FeatureId / Title / Priority:
- Objective: one cross-step business objective
- PrimaryAssertion: one final business assertion
- Covers / ExpectedBasis / ExpectedResult:
- CoverageTags: COMPOSITE_FLOW / LIFECYCLE / POST_CONDITION / DATA_CONSISTENCY
- DesignModels: STATE_MODEL / CRUD_LIFECYCLE_MATRIX / RELATION_INTEGRITY_MODEL / SESSION_MODEL
- InitialState:
- Preconditions / TestData:
- Steps:
  1. Perform the first approved transition.
- ExpectedPerStep:
  1. Step: 1 / Action: / Expected: / StateAfter:
- IntermediateAssertions:
- StateTransitions:
  - FROM --ACTION--> TO
- PostConditions:
- CrossStepInvariants:
- LifecycleStatus / ReviewGateStatus:
- RiskLevel: RISK_LOW / RISK_MEDIUM / RISK_HIGH / RISK_CRITICAL
- SideEffects: NONE / TEST_DATA_CREATE / TEST_DATA_UPDATE / TEST_DATA_DELETE / AUTH_CHANGE / SESSION_CHANGE / GLOBAL_CONFIG_CHANGE / EXTERNAL_EFFECT
- SideEffectScope: TEST_OWNED / PROJECT_SANDBOX / SHARED_ENVIRONMENT / UNKNOWN
- Reversibility: REVERSIBLE / CLEANUP_REVERSIBLE / IRREVERSIBLE / UNKNOWN
- DataOwnership: TEST_OWNED / PROJECT_SANDBOX / SHARED_ENVIRONMENT / UNKNOWN
- InteractionMode: UNATTENDED / INTERACTIVE
- AutomationType: AUTO / MANUAL
- AutomationEligibility: AUTO_ALLOWED / MANUAL_REQUIRED / NOT_EXECUTABLE
- ExpectationGapRefs:
- AutomationFramework:
- EvidenceRequirement:
- Cleanup:
- CleanupVerification:
- Status: BLOCKED
- Limitations:
