# Source Design Audit

- AuditType: SOURCE_ASSISTED_SYSTEM_TEST_DESIGN_AUDIT
- AuditStatus: PASS_WITH_OPEN_AUTHORITY_AND_COVERAGE_GAPS
- SourceIsExpectedOracle: false
- Expected authority hierarchy: REQUIREMENT > APPROVED_DESIGN > HANDOFF > FLOW_DESIGN > INTERFACE_CONTRACT > DESIGN_DEFAULT
- Source design conflicts: 0
- Source discoveries needing authority: 3

## Findings

- **RULE-USER-REQUIRED** — SOURCE_CONFIRMS_AUTHORITY; source: UserController.cs; expected: Approved handoff requires valid user data to save.
- **RULE-USER-DUPLICATE** — SOURCE_CONFIRMS_AUTHORITY; source: UserController.cs; expected: A duplicate approved baseline user must not create a second record.
- **RULE-TASK-PRIORITY-99** — SOURCE_DISCOVERED; source: Controller/taskController.cs:83; expected: The flow requires a valid priority boundary and deterministic rejection.
- **RULE-TASK-PENDING-CAP** — SOURCE_DISCOVERED_NEEDS_AUTHORITY; source: Interfaces/Service/Task/TaskService.cs:42; expected: The flow requires bounded queue preparation; the exact operational limit remains a source observation.
- **RULE-TASK-STATES** — SOURCE_CONFIRMS_AUTHORITY; source: Interfaces/Service/Task/TaskService.cs:253-340; expected: Flow expects 0, 1, 2, 7 and 10 lifecycle outcomes plus detail/queue observations.
- **RULE-TASK-CANCEL** — SOURCE_DISCOVERED; source: Controller/taskController.cs:213-359; expected: The flow distinguishes unexecuted cancellation from executing cancellation.
- **RULE-TASK-RESEND** — SOURCE_CONFIRMS_AUTHORITY; source: Areas/Task/TaskController.cs:ResendTask; expected: The flow requires a new task code while the original record remains unchanged.
- **RULE-FEEDBACK-QUEUE** — SOURCE_CONFIRMS_AUTHORITY; source: Interfaces/Service/Task/TaskStatueDetailService.cs:27-58; expected: The flow requires queue drain, retry, and log evidence from DB/MOCK/LOG.
- **RULE-FEEDBACK-MONTH-TABLE** — SOURCE_DISCOVERED; source: Interfaces/Service/Log/MsgSendThirdService.cs:151-175; expected: The flow calls for creation-month log lookup for cross-month tasks.
- **RULE-DUMMYCAR** — SOURCE_DISCOVERED_NEEDS_AUTHORITY; source: RCS/DummyCar.cs; expected: DummyCar is preferred for safe task execution.
- **RULE-WCS-INTERACTION** — SOURCE_DISCOVERED_NEEDS_AUTHORITY; source: RCS/Missions/ChainedDeliveryMission*.cs; expected: WCS reject/allow and retry behavior requires an approved mock or safe fixture.
- **RULE-FRONTEND-DYNAMIC-MENU** — SOURCE_DISCOVERED; source: src/plugins/permission.ts; src/router/index.ts; expected: Handoff requires menu/page/button/direct-URL permission coverage.
