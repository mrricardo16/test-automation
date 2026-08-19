# Synthetic Skill Acceptance Report

执行范围：PLATFORM-03 only。未实施 PLATFORM-04 API Harness、PLATFORM-05 TypeScript Quality Gate、PLATFORM-06 CI 或后续阶段。

## Overall Status

| Acceptance | Status | Meaning |
|---|---|---|
| CONTRACT_ACCEPTANCE | PASS | Deterministic, repo-owned, synthetic-only contract acceptance |
| AGENT_ACCEPTANCE_AUTOMATION | BLOCKED | 当前环境没有稳定的程序化 Skill invocation interface |
| AGENT_ACCEPTANCE_PROCEDURE | READY | 已生成执行说明、清单、预期 artifacts 和 validation script |
| PLATFORM-03 | COMPLETE_WITH_LIMITATION | Contract Acceptance 完成；真实 Agent Acceptance 等待 Controlled Run |

## Contract Acceptance Evidence

| TestCaseId | Input Fixture | Expected Contract | Actual Contract | GateStatus | Validation Issues |
|---|---|---|---|---|---|
| TC-SYN-CONTRACT-001 | `fixtures/synthetic-product/contracts/source-contract.json` | `HANDOFF_BASELINE`, read-only Expected | DEV → TEST IDs and Expected preserved | PASS | none |
| TC-SYN-CONTRACT-002 | Synthetic Source Contract | `APPROVED_BASELINE`, White-box baseline | Baseline/Coverage/TestCase/Execution/RootCause traceable | PASS/LIMITED/FAIL by baseline | none |
| TC-SYN-ACCEPTANCE-001 | AcceptanceExpectation fixtures | Five canonical expectation values | Product status remains separate from acceptance gate | PASS | none |
| TC-SYN-ACCEPTANCE-002 | Applicability/Baseline/Alignment fixtures | Canonical status combinations | APPLICABLE/NOT_APPLICABLE/CONDITIONAL/UNKNOWN and all baseline/alignment values represented | PASS/LIMITED/FAIL by case | none |
| TC-SYN-CONTRACT-003 | Legacy Coverage values | Explicit old → new mapping | COVERED_PASS/FAIL/ERROR, NOT_COVERED, MANUAL_PENDING mapped | PASS | none |
| TC-SYN-ACCEPTANCE-003 | Synthetic Runtime `/api/bugs/known` | Runtime Observation belongs to Actual evidence | RuntimeHandle/PID/base URL/ObservationEvidence/Execution recorded separately | PASS | none |

## Known Bug Acceptance

```text
BugId: SYN-BUG-001
Expected: enabled
Actual: disabled
ExecutionStatus: FAIL
CoverageStatus: COVERED
AcceptanceExpectation: EXPECT_PRODUCT_FAIL
GateStatus: PASS
```

The product result remains `FAIL`. The acceptance evaluator independently returns `GateStatus=PASS` because the expected defect was discovered. No execution result was rewritten to `PASS`.

## AcceptanceExpectation Matrix

| Expectation | Actual ExecutionStatus/Baseline | GateStatus |
|---|---|---|
| EXPECT_PASS | PASS | PASS |
| EXPECT_PRODUCT_FAIL | FAIL | PASS |
| EXPECT_PRODUCT_FAIL | PASS | FAIL |
| EXPECT_BLOCKED | BLOCKED | PASS |
| EXPECT_MANUAL | MANUAL | PASS |
| EXPECT_BASELINE_LIMITED | BASELINE_LIMITED | PASS |

## Applicability and Baseline

- `APPLICABLE`：accepted.
- `NOT_APPLICABLE`：requires `CoverageStatus=NOT_APPLICABLE` and `ApplicabilityReason`; never represented by execution PASS.
- `CONDITIONAL`：requires `ApplicabilityCondition`; unsatisfied condition cannot produce business PASS.
- `UNKNOWN`：preserved as unknown.
- `BASELINE_VALIDATED`：Gate PASS.
- `BASELINE_LIMITED`：Gate LIMITED and bounded execution.
- `BASELINE_INCOMPLETE`：Gate FAIL and execution BLOCKED.
- `SourceRuntimeAlignment` covered: `ALIGNED`, `MISMATCH`, `UNKNOWN`, `NOT_APPLICABLE`.

Handoff Expected remains `HANDOFF_BASELINE`; Runtime Observation is stored under `ObservationEvidenceIds`. A mismatch does not modify Expected.

## Agent Acceptance Boundary

The following was not claimed as executed:

- Actual `dev-test-handoff` Skill invocation.
- Actual `test-execution` Skill invocation.
- Actual `whitebox-test-execution` Skill invocation.

Reason: `MissingAgentInvocationCapability`.

Procedure artifacts:

- `scripts/platform/agent-acceptance-procedure.mjs`
- `scripts/platform/validate-agent-acceptance-procedure.mjs`
- `test-cases/synthetic/TC-SYN-AGENT-001.md`

Validation output:

```text
PROCEDURE_VALIDATION=PASS
AGENT_ACCEPTANCE_STATUS=BLOCKED
AGENT_ACCEPTANCE_PROCEDURE=READY
```

Skill `self_test.py` and `validate_contract.py` results are component checks only; they are not Agent Acceptance evidence.

## Execution Commands

```text
npx playwright test --config=tests/acceptance/skill-to-skill/playwright.config.ts --reporter=line
npx playwright test tests/web/platform-contract-validator.spec.ts --reporter=line
npx playwright test tests/web/synthetic-product-runtime.spec.ts --reporter=line
node scripts/platform/validate-agent-acceptance-procedure.mjs
python skills/dev-test-handoff/scripts/self_test.py
python skills/test-execution/scripts/validate_contract.py
python skills/whitebox-test-execution/scripts/self_test.py
python skills/whitebox-test-execution/scripts/validate_contract.py
```

Results:

- PLATFORM-03 focused tests: 12 passed, 1 worker.
- PLATFORM-01 regression: 8 passed.
- PLATFORM-02 regression: 10 passed.
- `dev-test-handoff` self-test: PASS; its temporary Mock Handoff fixture was validated in-process.
- `test-execution` self-test and static validator: PASS.
- `whitebox-test-execution` self-test and static validator: PASS.
- Standalone `dev-test-handoff/scripts/validate_contract.py` requires a controlled artifact root; it remains part of the Agent Acceptance procedure and was not misreported as an Agent Acceptance run.
- Procedure validator: PASS.
- UTF-8 and executable forbidden-path scan: PASS.

## Safety Boundary

- Real business localhost: No.
- `config/local-projects.json`: No runtime read.
- Real source/DLL/database/device/credentials: No.
- Existing three Skills modified: No.
- Existing historical files modified: No.
- Non-owned process closed: No.
- Synthetic Runtime used only its own dynamic localhost and owned PID.
