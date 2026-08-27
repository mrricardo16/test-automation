#!/usr/bin/env python3
"""Executable contract test for TEST-EXECUTION multi-agent orchestration."""

from __future__ import annotations

import json

from orchestrator import (
    build_dependency_graph,
    build_execution_plan,
    classify_case,
    deduplicate_evidence,
    deduplicate_defects,
    locks_compatible,
    reconcile_results,
    validate_evidence_records,
    validate_execution_plan,
    validate_reconciled_results,
    validate_worker_plan,
)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def synthetic_cases() -> list[dict]:
    return [
        {
            "TestCaseId": "TC-SYN-ORCH-A",
            "Module": "日志管理",
            "Feature": "日志文件",
            "Operation": "READ",
            "ResourceLocks": [{"Resource": "LOG_READ", "Mode": "READ"}],
            "ParallelSafety": "PARALLEL_SAFE",
            "AutomationEligibility": "AUTO_ALLOWED",
            "SessionProfile": "WEB_ISOLATED",
        },
        {
            "TestCaseId": "TC-SYN-ORCH-B",
            "Module": "统计分析",
            "Feature": "效能统计",
            "Operation": "READ",
            "ResourceLocks": [{"Resource": "STAT_READ", "Mode": "READ"}],
            "ParallelSafety": "PARALLEL_SAFE",
            "AutomationEligibility": "AUTO_ALLOWED",
            "SessionProfile": "WEB_ISOLATED",
        },
        {
            "TestCaseId": "TC-SYN-ORCH-C",
            "Module": "系统管理",
            "Feature": "用户管理",
            "Operation": "CREATE",
            "ResourceLocks": [{"Resource": "USER_DATA", "Mode": "SHARED_WRITE", "Namespace": "AT_RUN1_W1_USER"}],
            "TestDataNamespace": "AT_RUN1_W1_USER",
            "ParallelSafety": "PARALLEL_SAFE_WITH_NAMESPACE",
            "AutomationEligibility": "AUTO_ALLOWED",
            "SessionProfile": "WEB_ISOLATED",
        },
        {
            "TestCaseId": "TC-SYN-ORCH-D",
            "Module": "系统管理",
            "Feature": "字典管理",
            "Operation": "CREATE",
            "ResourceLocks": [{"Resource": "DICT_DATA", "Mode": "SHARED_WRITE", "Namespace": "AT_RUN1_W2_DICT"}],
            "TestDataNamespace": "AT_RUN1_W2_DICT",
            "ParallelSafety": "PARALLEL_SAFE_WITH_NAMESPACE",
            "AutomationEligibility": "AUTO_ALLOWED",
            "SessionProfile": "WEB_ISOLATED",
        },
        {
            "TestCaseId": "TC-SYN-ORCH-E",
            "Module": "场景管理",
            "Feature": "车辆管理",
            "Operation": "INITIALIZE",
            "ResourceLocks": [{"Resource": "DUMMYCAR", "Mode": "EXCLUSIVE"}],
            "ParallelSafety": "SERIAL_SHARED_STATE",
            "AutomationEligibility": "MANUAL_REQUIRED",
            "SessionProfile": "WEB_ISOLATED",
        },
        {
            "TestCaseId": "TC-SYN-ORCH-F",
            "Module": "任务模型",
            "Feature": "任务管理",
            "Operation": "DISPATCH",
            "Dependencies": ["TC-SYN-ORCH-E"],
            "ResourceLocks": [{"Resource": "TASK_DISPATCH", "Mode": "EXCLUSIVE"}],
            "ParallelSafety": "SERIAL_SHARED_STATE",
            "AutomationEligibility": "MANUAL_REQUIRED",
            "SessionProfile": "WEB_ISOLATED",
        },
    ]


def main() -> int:
    cases = synthetic_cases()
    graph = build_dependency_graph(cases)
    plan = build_execution_plan(cases, graph, available_worker_capacity=2, run_id="RUN1")
    issues = validate_execution_plan(plan, cases, graph)
    require(not issues, f"execution plan validation failed: {issues}")

    parallel_ids = {case_id for batch in plan["ParallelBatches"] for worker in batch["Workers"] for case_id in worker["AssignedTestCases"]}
    serial_ids = [case_id for item in plan["StatefulSerialLane"] for case_id in item["AssignedTestCases"]]
    require({"TC-SYN-ORCH-A", "TC-SYN-ORCH-B", "TC-SYN-ORCH-C", "TC-SYN-ORCH-D"} <= parallel_ids, "safe cases must be parallel-eligible")
    require(serial_ids == ["TC-SYN-ORCH-E", "TC-SYN-ORCH-F"], "stateful cases must preserve dependency order")
    require(plan["Metrics"]["ParallelCaseCount"] == 4, "parallel case metric")
    require(plan["Metrics"]["SerialCaseCount"] == 2, "serial case metric")
    conflict_cases = [
        {"TestCaseId": "TC-SYN-ORCH-CONFLICT-1", "ResourceLocks": [{"Resource": "USER_DATA", "Mode": "SHARED_WRITE", "Namespace": "AT_RUN1_CONFLICT"}], "ParallelSafety": "PARALLEL_SAFE_WITH_NAMESPACE", "AutomationEligibility": "AUTO_ALLOWED"},
        {"TestCaseId": "TC-SYN-ORCH-CONFLICT-2", "ResourceLocks": [{"Resource": "USER_DATA", "Mode": "SHARED_WRITE", "Namespace": "AT_RUN1_CONFLICT"}], "ParallelSafety": "PARALLEL_SAFE_WITH_NAMESPACE", "AutomationEligibility": "AUTO_ALLOWED"},
    ]
    conflict_graph = build_dependency_graph(conflict_cases)
    require(any(edge["Type"] == "RESOURCE_CONFLICT" for edge in conflict_graph["Edges"]), "resource conflict edge")
    require(classify_case(cases[0]) == "INDEPENDENT_PARALLEL", "read-only lane classification")
    require(classify_case(cases[4]) == "STATEFUL_SERIAL", "exclusive lane classification")
    require(classify_case({"TestCaseId": "TC-M", "ParallelSafety": "MANUAL_REVIEW_REQUIRED", "AutomationEligibility": "MANUAL_REQUIRED", "ResourceLocks": []}) == "MANUAL", "manual lane classification")
    require(classify_case({"TestCaseId": "TC-S", "ParallelSafety": "SAFETY_BLOCKED", "AutomationEligibility": "PROHIBITED", "ResourceLocks": []}) == "SAFETY_BLOCKED", "safety lane classification")
    require(locks_compatible({"Resource": "R", "Mode": "READ"}, {"Resource": "R", "Mode": "READ"}), "read locks coexist")
    require(not locks_compatible({"Resource": "R", "Mode": "READ"}, {"Resource": "R", "Mode": "EXCLUSIVE"}), "exclusive lock conflicts")
    require(locks_compatible({"Resource": "R", "Mode": "SHARED_WRITE", "Namespace": "AT_RUN1_W1"}, {"Resource": "R", "Mode": "SHARED_WRITE", "Namespace": "AT_RUN1_W2"}), "different namespaces coexist")
    require(not locks_compatible({"Resource": "R", "Mode": "SHARED_WRITE", "Namespace": "AT_RUN1_W1"}, {"Resource": "R", "Mode": "SHARED_WRITE", "Namespace": "AT_RUN1_W1"}), "same namespace conflicts")
    all_workers = [worker for batch in plan["ParallelBatches"] for worker in batch["Workers"]] + plan["StatefulSerialLane"]
    require(all(not validate_worker_plan(worker, "RUN1") for worker in all_workers), "worker isolation validators")
    require(plan["SingleWriterPlan"]["WorkerGlobalWritesAllowed"] is False, "orchestrator must be the global single writer")

    results = [
        {"RunId": "RUN1", "WorkerId": "worker-001", "TestCaseId": "TC-SYN-ORCH-A", "ExecutionAttempted": True, "FinalStatus": "PASS", "Expected": "log is readable", "Actual": "log is readable", "FailureCategory": None, "BlockReason": None, "ManualReviewRequired": False, "StartTime": "2026-08-27T00:00:00Z", "EndTime": "2026-08-27T00:00:01Z", "EvidenceRefs": ["E-A"], "FixtureRefs": [], "CleanupResult": {"ResidualCount": 0}},
        {"RunId": "RUN1", "WorkerId": "worker-002", "TestCaseId": "TC-SYN-ORCH-B", "ExecutionAttempted": True, "FinalStatus": "PASS", "Expected": "stat is readable", "Actual": "stat is readable", "FailureCategory": None, "BlockReason": None, "ManualReviewRequired": False, "StartTime": "2026-08-27T00:00:00Z", "EndTime": "2026-08-27T00:00:01Z", "EvidenceRefs": ["E-B"], "FixtureRefs": [], "CleanupResult": {"ResidualCount": 0}},
    ]
    reconciled = reconcile_results(results)
    require(reconciled["Status"] == "PASS", "result reconciliation")
    require(reconciled["DuplicateFormalResult"] == 0, "no duplicate formal result")
    require(not validate_reconciled_results(reconciled), "reconciled result validation")

    retry_result = dict(results[0], Attempt=1)
    retry_result_2 = dict(results[0], Attempt=2, FinalStatus="ERROR", Actual="transient harness error")
    retried = reconcile_results([retry_result, retry_result_2])
    require(retried["Status"] == "ERROR" and retried["RetryCount"] == 1 and retried["DuplicateFormalResult"] == 0, "retries retain attempts without formal conflict")

    evidence = deduplicate_evidence([
        {"EvidenceId": "E-A", "WorkerId": "worker-001", "TestCaseId": "TC-SYN-ORCH-A", "Path": "runs/RUN1/workers/worker-001/evidence/a.png"},
        {"EvidenceId": "E-A", "WorkerId": "worker-001", "TestCaseId": "TC-SYN-ORCH-A", "Path": "runs/RUN1/workers/worker-001/evidence/a.png"},
    ])
    require(len(evidence["Evidence"]) == 1 and evidence["DuplicateCount"] == 1 and not evidence["Conflicts"], "identical evidence must deduplicate")
    require(not validate_evidence_records(evidence["Evidence"], plan["AssignmentRegistry"]), "evidence ownership validation")

    conflicting = reconcile_results(results + [dict(results[0], WorkerId="worker-009")])
    require(conflicting["Status"] == "RESULT_CONFLICT" and conflicting["DuplicateFormalResult"] == 1, "duplicate formal results must conflict")

    defects = deduplicate_defects([
        {"DefectId": "DEF-1", "Feature": "任务管理", "Operation": "DISPATCH", "EndpointOrPage": "/task", "FailureCategory": "BUSINESS_ASSERTION_FAIL", "NormalizedFailureSignature": "dispatch rejected"},
        {"DefectId": "DEF-2", "Feature": "任务管理", "Operation": "DISPATCH", "EndpointOrPage": "/task", "FailureCategory": "BUSINESS_ASSERTION_FAIL", "NormalizedFailureSignature": "dispatch rejected"},
    ])
    require(len(defects["Defects"]) == 1 and defects["MergedCount"] == 1, "same defect fingerprint must merge")

    print(json.dumps({
        "status": "PASS",
        "TestCaseId": "TC-PLATFORM-16-MULTI-AGENT-ORCHESTRATION-001",
        "ParallelCaseCount": plan["Metrics"]["ParallelCaseCount"],
        "SerialCaseCount": plan["Metrics"]["SerialCaseCount"],
        "Reconciliation": reconciled["Status"],
        "DefectDedup": "PASS",
        "GlobalReportWrites": 0,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
