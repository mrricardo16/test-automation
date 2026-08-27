# TC-PLATFORM-16-MULTI-AGENT-ORCHESTRATION-001

- Title: TEST-EXECUTION multi-agent orchestration contract and scheduler self-test
- Type: Platform skill self-test
- Objective: Prove that executable TestCases are classified into independent parallel work or a stateful serial lane using dependency and resource-lock evidence.
- Preconditions: The repository contains `skills/test-execution` and Python 3 is available.
- Test data: Synthetic Cases A-F defined by `skills/test-execution/scripts/orchestration_self_test.py`; no product runtime or production data.
- Steps:
  1. Build READ, namespace-isolated write, DummyCar, and task-dispatch synthetic Cases.
  2. Build the dependency graph and execution plan with an explicit available worker capacity.
  3. Validate worker session, browser-context, namespace, artifact, cleanup, result, evidence, defect, and single-writer invariants.
  4. Reconcile synthetic results and deduplicate the same defect fingerprint.
- Expected Result: READ and namespace-isolated CRUD Cases share an independent parallel phase; DummyCar and TASK_DISPATCH Cases are in dependency-ordered `STATEFUL_SERIAL`; every executable Case has one assignment; worker outputs do not write global reports; reconciliation and validators pass.
- AutomationEligibility: AUTO_ALLOWED
- SideEffects: NONE
- Cleanup: Temporary self-test data is removed by the script.
- Status: BLOCKED until the orchestration implementation exists; this record is the contract for the self-test.
