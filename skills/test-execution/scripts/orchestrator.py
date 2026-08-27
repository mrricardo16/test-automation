#!/usr/bin/env python3
"""Deterministic, side-effect-free helpers for test execution orchestration."""

from __future__ import annotations

from collections import defaultdict
from copy import deepcopy
import hashlib
import json
import re
from typing import Iterable, Mapping, Sequence


LOCK_MODES = {"READ", "SHARED_WRITE", "EXCLUSIVE"}
LANES = {"INDEPENDENT_PARALLEL", "STATEFUL_SERIAL", "MANUAL", "SAFETY_BLOCKED"}
FINAL_STATUSES = {"PASS", "FAIL", "ERROR", "BLOCKED", "MANUAL", "SKIPPED"}
RESULT_FIELDS = (
    "RunId", "WorkerId", "TestCaseId", "ExecutionAttempted", "FinalStatus",
    "Expected", "Actual", "FailureCategory", "BlockReason", "ManualReviewRequired",
    "StartTime", "EndTime", "EvidenceRefs", "FixtureRefs", "CleanupResult",
)
GLOBAL_ARTIFACTS = (
    "testcase-assignment-registry.json",
    "expanded-catalog.json",
    "formal-result.json",
    "formal-results.json",
    "evidence-index.json",
    "global-evidence-index.json",
    "defect-index.json",
    "global-defect-index.json",
    "coverage.json",
    "final-coverage-summary.json",
    "final-report.md",
    "final-report.html",
    "RSSComposer调度系统测试报告.md",
    "RSSComposer调度系统测试报告.html",
    "final-summary.json",
)


def _case_id(case: Mapping[str, object]) -> str:
    value = case.get("TestCaseId")
    if not isinstance(value, str) or not value.strip():
        raise ValueError("every case requires a non-empty TestCaseId")
    return value.strip()


def _safe_token(value: str) -> str:
    token = re.sub(r"[^A-Za-z0-9_-]+", "_", value).strip("_")
    return token or "UNNAMED"


def _locks(case: Mapping[str, object]) -> list[dict]:
    locks = case.get("ResourceLocks", [])
    if not isinstance(locks, list):
        raise ValueError(f"{_case_id(case)} ResourceLocks must be a list")
    normalized: list[dict] = []
    for lock in locks:
        if not isinstance(lock, Mapping):
            raise ValueError(f"{_case_id(case)} contains a non-object resource lock")
        resource = lock.get("Resource")
        mode = lock.get("Mode")
        if not isinstance(resource, str) or not resource.strip():
            raise ValueError(f"{_case_id(case)} contains a lock without Resource")
        if mode not in LOCK_MODES:
            raise ValueError(f"{_case_id(case)} contains invalid lock mode: {mode}")
        normalized.append(dict(lock, Resource=resource.strip(), Mode=mode))
    return normalized


def locks_compatible(left: Mapping[str, object], right: Mapping[str, object]) -> bool:
    """Return compatibility for two locks; different resources never conflict."""
    if left.get("Resource") != right.get("Resource"):
        return True
    left_mode, right_mode = left.get("Mode"), right.get("Mode")
    if left_mode not in LOCK_MODES or right_mode not in LOCK_MODES:
        return False
    if "EXCLUSIVE" in (left_mode, right_mode):
        return False
    if left_mode == right_mode == "READ":
        return True
    if left_mode == right_mode == "SHARED_WRITE":
        left_namespace = left.get("Namespace")
        right_namespace = right.get("Namespace")
        return bool(left_namespace and right_namespace and left_namespace != right_namespace)
    return bool(
        left.get("ReadSharedWriteCompatible") is True
        and right.get("ReadSharedWriteCompatible") is True
    )


def resource_locks_compatible(left: Sequence[Mapping[str, object]], right: Sequence[Mapping[str, object]]) -> bool:
    return all(locks_compatible(a, b) for a in left for b in right)


def _topological_order(dependencies: Mapping[str, Sequence[str]], order_index: Mapping[str, int]) -> list[str]:
    dependents: dict[str, list[str]] = {case_id: [] for case_id in dependencies}
    indegree = {case_id: len(dependencies[case_id]) for case_id in dependencies}
    for case_id, required in dependencies.items():
        for dependency in required:
            dependents[dependency].append(case_id)
    ready = sorted((case_id for case_id, degree in indegree.items() if degree == 0), key=order_index.get)
    result: list[str] = []
    while ready:
        current = ready.pop(0)
        result.append(current)
        for dependent in sorted(dependents[current], key=order_index.get):
            indegree[dependent] -= 1
            if indegree[dependent] == 0:
                ready.append(dependent)
        ready.sort(key=order_index.get)
    if len(result) != len(dependencies):
        cycle_nodes = [case_id for case_id, degree in indegree.items() if degree > 0]
        raise ValueError(f"dependency cycle detected: {cycle_nodes}")
    return result


def _case_edge_type(source: Mapping[str, object], target: Mapping[str, object], explicit: bool) -> str:
    if explicit:
        source_fixtures = set(_as_list(source.get("ProducesFixtures")))
        target_fixtures = set(_as_list(target.get("ConsumesFixtures")))
        if source_fixtures & target_fixtures:
            return "FIXTURE_DEPENDENCY"
        source_states = set(_as_list(source.get("ProducesStates")))
        target_states = set(_as_list(target.get("ConsumesStates")))
        if source_states & target_states:
            return "STATE_DEPENDENCY"
        return "ORDERING_DEPENDENCY"
    return "RESOURCE_CONFLICT"


def build_dependency_graph(cases: Sequence[Mapping[str, object]]) -> dict:
    """Build a stable dependency/lock graph, including deterministic conflict edges."""
    ids = [_case_id(case) for case in cases]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate TestCaseId in execution scope")
    known = set(ids)
    by_id = {case_id: case for case, case_id in zip(cases, ids)}
    explicit_dependencies: dict[str, list[str]] = {}
    for case, case_id in zip(cases, ids):
        raw = case.get("Dependencies", [])
        if not isinstance(raw, list) or any(not isinstance(item, str) for item in raw):
            raise ValueError(f"{case_id} Dependencies must be a string list")
        deps = list(dict.fromkeys(raw))
        missing = [item for item in deps if item not in known]
        if missing:
            raise ValueError(f"{case_id} has missing dependencies: {missing}")
        if case_id in deps:
            raise ValueError(f"{case_id} cannot depend on itself")
        explicit_dependencies[case_id] = deps

    order_index = {case_id: index for index, case_id in enumerate(ids)}
    explicit_order = _topological_order(explicit_dependencies, order_index)
    dependencies = {case_id: list(explicit_dependencies[case_id]) for case_id in ids}
    edge_types: dict[tuple[str, str], str] = {}
    for target_id, required in explicit_dependencies.items():
        for source_id in required:
            edge_types[(source_id, target_id)] = _case_edge_type(by_id[source_id], by_id[target_id], True)

    for left_index, source_id in enumerate(explicit_order):
        for target_id in explicit_order[left_index + 1:]:
            if resource_locks_compatible(_locks(by_id[source_id]), _locks(by_id[target_id])):
                continue
            if source_id not in dependencies[target_id]:
                dependencies[target_id].append(source_id)
                edge_types[(source_id, target_id)] = "RESOURCE_CONFLICT"

    topological = _topological_order(dependencies, order_index)
    dependents: dict[str, list[str]] = {case_id: [] for case_id in ids}
    for target_id, required in dependencies.items():
        for source_id in required:
            dependents[source_id].append(target_id)
    edges = [
        {"From": source_id, "To": target_id, "Type": edge_types[(source_id, target_id)]}
        for target_id in ids
        for source_id in dependencies[target_id]
    ]
    nodes = []
    for case_id in ids:
        case = by_id[case_id]
        nodes.append({
            "TestCaseId": case_id,
            "Requires": list(dependencies[case_id]),
            "Produces": _as_list(case.get("ProducesFixtures")),
            "ResourceLocks": _locks(case),
            "ParallelSafety": case.get("ParallelSafety"),
            "ExecutionLane": classify_case(case),
        })
    return {
        "Nodes": ids,
        "NodeMetadata": nodes,
        "Dependencies": dependencies,
        "Dependents": dependents,
        "TopologicalOrder": topological,
        "Edges": edges,
    }


def validate_dependency_graph(graph: Mapping[str, object], cases: Sequence[Mapping[str, object]]) -> list[str]:
    issues: list[str] = []
    try:
        expected = build_dependency_graph(cases)
    except ValueError as error:
        return [str(error)]
    for field in ("Nodes", "NodeMetadata", "Dependencies", "Dependents", "TopologicalOrder", "Edges"):
        if graph.get(field) != expected[field]:
            issues.append(f"dependency graph {field} does not match cases")
    return issues


def classify_case(case: Mapping[str, object]) -> str:
    """Classify a case from explicit safety, automation, and lock metadata."""
    safety = case.get("ParallelSafety")
    eligibility = case.get("AutomationEligibility")
    locks = _locks(case)
    if safety == "SAFETY_BLOCKED" or eligibility in {"SAFETY_BLOCKED", "PROHIBITED"}:
        return "SAFETY_BLOCKED"
    if safety == "SERIAL_SHARED_STATE" or any(lock["Mode"] == "EXCLUSIVE" for lock in locks):
        return "STATEFUL_SERIAL"
    if safety == "MANUAL_REVIEW_REQUIRED" or eligibility in {"MANUAL", "MANUAL_ONLY", "MANUAL_REQUIRED"}:
        return "MANUAL"
    if safety in {"PARALLEL_SAFE", "PARALLEL_SAFE_WITH_NAMESPACE"}:
        if any(lock["Mode"] == "SHARED_WRITE" and not lock.get("Namespace") for lock in locks):
            return "SAFETY_BLOCKED"
        return "INDEPENDENT_PARALLEL"
    return "SAFETY_BLOCKED"


def _worker_plan(
    case: Mapping[str, object],
    run_id: str,
    worker_id: str,
    lane: str,
) -> dict:
    case_id = _case_id(case)
    namespace = f"AT_{_safe_token(run_id)}_{_safe_token(worker_id)}_DATA"
    artifact_root = f"runs/{run_id}/workers/{worker_id}"
    web = str(case.get("SessionProfile", "")).startswith("WEB")
    return {
        "RunId": run_id,
        "WorkerId": worker_id,
        "WorkerRole": "INDEPENDENT_TEST_WORKER" if lane == "INDEPENDENT_PARALLEL" else "STATEFUL_TEST_WORKER",
        "Lane": lane,
        "AssignedTestCases": [case_id],
        "AgentSessionId": f"{run_id}:{worker_id}:agent",
        "ExecutionContextId": f"{run_id}:{worker_id}:execution",
        "BrowserContextId": f"{run_id}:{worker_id}:browser" if web else None,
        "PageId": f"{run_id}:{worker_id}:page" if web else None,
        "CookieJarId": f"{run_id}:{worker_id}:cookies" if web else None,
        "StorageStateCopy": f"{artifact_root}/storage-state.json" if web else None,
        "SessionProfile": case.get("SessionProfile"),
        "Namespace": namespace,
        "TestDataNamespace": namespace,
        "RequestedTestDataNamespace": case.get("TestDataNamespace"),
        "ArtifactRoot": artifact_root,
        "ResourceLocks": _locks(case),
        "OutputPlan": {
            "Scope": "WORKER_ONLY",
            "Root": artifact_root,
            "Files": [
                "plan.json", "result.json", "evidence-index.json", "fixture-registry.json",
                "cleanup.json", "defect-proposals.json", "coverage.json", "catalog-proposals.json",
            ],
            "GlobalReportWrites": False,
        },
        "CleanupOwnership": {"WorkerId": worker_id, "Namespace": namespace, "DeleteOwnNamespaceOnly": True},
        "SafetyRules": ["product source is read-only", "no global report writes"],
    }


def build_execution_plan(
    cases: Sequence[Mapping[str, object]],
    graph: Mapping[str, object],
    *,
    available_worker_capacity: int,
    run_id: str,
) -> dict:
    """Plan work using only the capacity explicitly supplied by the caller."""
    if isinstance(available_worker_capacity, bool) or not isinstance(available_worker_capacity, int) or available_worker_capacity < 1:
        raise ValueError("available_worker_capacity must be a positive integer")
    if not isinstance(run_id, str) or not run_id.strip():
        raise ValueError("run_id must be a non-empty string")
    graph_issues = validate_dependency_graph(graph, cases)
    if graph_issues:
        raise ValueError("; ".join(graph_issues))

    by_id = {_case_id(case): case for case in cases}
    lane_by_id: dict[str, str] = {}
    for case_id in graph["TopologicalOrder"]:
        lane = classify_case(by_id[case_id])
        dependency_lanes = {lane_by_id[dependency] for dependency in graph["Dependencies"][case_id]}
        if lane == "INDEPENDENT_PARALLEL":
            if "SAFETY_BLOCKED" in dependency_lanes:
                lane = "SAFETY_BLOCKED"
            elif "MANUAL" in dependency_lanes:
                lane = "MANUAL"
            elif "STATEFUL_SERIAL" in dependency_lanes:
                lane = "STATEFUL_SERIAL"
        lane_by_id[case_id] = lane
    parallel_ids = [case_id for case_id in graph["TopologicalOrder"] if lane_by_id[case_id] == "INDEPENDENT_PARALLEL"]
    parallel_set = set(parallel_ids)
    completed: set[str] = set()
    remaining = list(parallel_ids)
    batches: list[dict] = []
    worker_counter = 0
    while remaining:
        selected: list[str] = []
        for case_id in remaining:
            parallel_dependencies = [dep for dep in graph["Dependencies"][case_id] if dep in parallel_set]
            if not set(parallel_dependencies) <= completed:
                continue
            candidate_locks = _locks(by_id[case_id])
            if all(resource_locks_compatible(candidate_locks, _locks(by_id[other])) for other in selected):
                selected.append(case_id)
            if len(selected) == available_worker_capacity:
                break
        if not selected:
            raise ValueError("parallel scheduling deadlock")
        workers: list[dict] = []
        for case_id in selected:
            worker_counter += 1
            workers.append(_worker_plan(by_id[case_id], run_id, f"worker-{worker_counter:03d}", "INDEPENDENT_PARALLEL"))
        batches.append({"BatchId": f"parallel-{len(batches) + 1:03d}", "Workers": workers})
        completed.update(selected)
        remaining = [case_id for case_id in remaining if case_id not in selected]

    serial: list[dict] = []
    for case_id in graph["TopologicalOrder"]:
        if lane_by_id[case_id] == "STATEFUL_SERIAL":
            worker_counter += 1
            serial.append(_worker_plan(by_id[case_id], run_id, f"worker-{worker_counter:03d}", "STATEFUL_SERIAL"))

    manual = [case_id for case_id in graph["TopologicalOrder"] if lane_by_id[case_id] == "MANUAL"]
    blocked = [case_id for case_id in graph["TopologicalOrder"] if lane_by_id[case_id] == "SAFETY_BLOCKED"]
    assignments = [worker for batch in batches for worker in batch["Workers"]] + serial
    return {
        "RunId": run_id,
        "AvailableWorkerCapacity": available_worker_capacity,
        "LaneByTestCase": lane_by_id,
        "ParallelBatches": batches,
        "ParallelPhaseReconciliationGate": {"Required": bool(batches), "Status": "PENDING" if batches else "NOT_APPLICABLE"},
        "StatefulSerialLane": serial,
        "ManualLane": manual,
        "SafetyBlockedLane": blocked,
        "AssignmentRegistry": {case_id: worker["WorkerId"] for worker in assignments for case_id in worker["AssignedTestCases"]},
        "SingleWriterPlan": {"Owner": "TEST_ORCHESTRATOR", "GlobalArtifacts": list(GLOBAL_ARTIFACTS), "WorkerGlobalWritesAllowed": False},
        "Metrics": {
            "ParallelCaseCount": len(parallel_ids),
            "SerialCaseCount": len(serial),
            "ManualCaseCount": len(manual),
            "SafetyBlockedCaseCount": len(blocked),
            "PlannedWorkerAssignmentCount": len(assignments),
        },
    }


def validate_worker_plan(worker: Mapping[str, object], run_id: str | None = None) -> list[str]:
    issues: list[str] = []
    worker_id = worker.get("WorkerId")
    actual_run_id = worker.get("RunId")
    if run_id is not None and actual_run_id != run_id:
        issues.append(f"{worker_id} RunId mismatch")
    for field in ("WorkerId", "WorkerRole", "Lane", "AgentSessionId", "ExecutionContextId", "Namespace", "TestDataNamespace", "ArtifactRoot"):
        if not isinstance(worker.get(field), str) or not worker.get(field):
            issues.append(f"worker missing {field}")
    expected_root = f"runs/{actual_run_id}/workers/{worker_id}"
    if worker.get("ArtifactRoot") != expected_root:
        issues.append(f"{worker_id} artifact root is not worker-owned")
    namespace_prefix = f"AT_{_safe_token(str(actual_run_id))}_{_safe_token(str(worker_id))}_"
    if not str(worker.get("TestDataNamespace", "")).startswith(namespace_prefix):
        issues.append(f"{worker_id} test data namespace is not TEST_OWNED")
    output = worker.get("OutputPlan")
    if not isinstance(output, Mapping) or output.get("Scope") != "WORKER_ONLY" or output.get("GlobalReportWrites") is not False:
        issues.append(f"{worker_id} output plan permits non-worker writes")
    elif output.get("Root") != expected_root:
        issues.append(f"{worker_id} output root is not worker-owned")
    cleanup = worker.get("CleanupOwnership")
    if (
        not isinstance(cleanup, Mapping)
        or cleanup.get("WorkerId") != worker_id
        or cleanup.get("Namespace") != worker.get("TestDataNamespace")
        or cleanup.get("DeleteOwnNamespaceOnly") is not True
    ):
        issues.append(f"{worker_id} cleanup ownership is invalid")
    if worker.get("SessionProfile", "") and str(worker.get("SessionProfile")).startswith("WEB"):
        for field in ("BrowserContextId", "PageId", "CookieJarId", "StorageStateCopy"):
            if not worker.get(field):
                issues.append(f"{worker_id} web plan missing {field}")
        if worker.get("StorageStateCopy") and not str(worker["StorageStateCopy"]).startswith(f"{expected_root}/"):
            issues.append(f"{worker_id} storage state is outside artifact root")
    try:
        for lock in worker.get("ResourceLocks", []):
            if lock.get("Mode") not in LOCK_MODES or not lock.get("Resource"):
                issues.append(f"{worker_id} has an invalid resource lock")
    except AttributeError:
        issues.append(f"{worker_id} resource locks are invalid")
    return issues


def validate_worker_output(output: Mapping[str, object]) -> list[str]:
    """Validate the aggregate output contract emitted by one worker."""
    issues: list[str] = []
    for field in (
        "WorkerId", "AssignedCount", "AttemptedCount", "PassCount", "FailCount",
        "ErrorCount", "BlockedCount", "ManualReviewCount", "ResultPath",
        "EvidenceIndexPath", "FixtureRegistryPath", "CleanupPath", "DefectPath",
        "CoveragePath", "FinalWorkerStatus",
    ):
        if field not in output:
            issues.append(f"worker output missing {field}")
    if output.get("FinalWorkerStatus") not in FINAL_STATUSES | {"STOPPED"}:
        issues.append("worker output has invalid FinalWorkerStatus")
    return issues


def validate_cleanup_record(record: Mapping[str, object], worker_id: str | None = None) -> list[str]:
    issues: list[str] = []
    for field in ("OwnedFixtureCount", "DeletedFixtureCount", "ResidualCount", "CleanupEvidence"):
        if field not in record:
            issues.append(f"cleanup record missing {field}")
    if worker_id is not None and record.get("WorkerId") != worker_id:
        issues.append("cleanup record owner mismatch")
    if record.get("CrossNamespaceDeletion", False) is True:
        issues.append("cross-namespace cleanup is forbidden")
    if isinstance(record.get("ResidualCount"), int) and record["ResidualCount"] < 0:
        issues.append("cleanup residual count cannot be negative")
    return issues


def validate_execution_plan(
    plan: Mapping[str, object],
    cases: Sequence[Mapping[str, object]],
    graph: Mapping[str, object],
) -> list[str]:
    issues = validate_dependency_graph(graph, cases)
    all_workers = [worker for batch in plan.get("ParallelBatches", []) for worker in batch.get("Workers", [])]
    all_workers += list(plan.get("StatefulSerialLane", []))
    for worker in all_workers:
        issues.extend(validate_worker_plan(worker, plan.get("RunId")))

    worker_ids = [worker.get("WorkerId") for worker in all_workers]
    if len(worker_ids) != len(set(worker_ids)):
        issues.append("worker IDs must be unique")
    for field in ("AgentSessionId", "ExecutionContextId", "BrowserContextId", "Namespace", "ArtifactRoot"):
        values = [worker.get(field) for worker in all_workers if worker.get(field)]
        if len(values) != len(set(values)):
            issues.append(f"{field} values must be isolated")

    lane_by_id = plan.get("LaneByTestCase", {})
    if set(lane_by_id) != set(graph.get("Nodes", [])):
        issues.append("lane map must cover every graph node exactly once")
    executable = {case_id for case_id, lane in lane_by_id.items() if lane in {"INDEPENDENT_PARALLEL", "STATEFUL_SERIAL"}}
    assigned = [case_id for worker in all_workers for case_id in worker.get("AssignedTestCases", [])]
    if set(assigned) != executable or len(assigned) != len(set(assigned)):
        issues.append("every executable case must have exactly one assignment")
    registry = plan.get("AssignmentRegistry", {})
    if set(registry) != executable:
        issues.append("assignment registry does not match executable cases")
    elif any(worker_id not in set(worker_ids) for worker_id in registry.values()):
        issues.append("assignment registry references an unknown worker")

    capacity = plan.get("AvailableWorkerCapacity")
    if isinstance(capacity, bool) or not isinstance(capacity, int) or capacity < 1:
        issues.append("available worker capacity is invalid")
    else:
        for batch in plan.get("ParallelBatches", []):
            workers = batch.get("Workers", [])
            if len(workers) > capacity:
                issues.append(f"{batch.get('BatchId')} exceeds available worker capacity")
            for index, worker in enumerate(workers):
                for other in workers[index + 1:]:
                    if not resource_locks_compatible(worker.get("ResourceLocks", []), other.get("ResourceLocks", [])):
                        issues.append(f"{batch.get('BatchId')} contains incompatible locks")

    serial_ids = [case_id for worker in plan.get("StatefulSerialLane", []) for case_id in worker.get("AssignedTestCases", [])]
    expected_serial = [case_id for case_id in graph.get("TopologicalOrder", []) if lane_by_id.get(case_id) == "STATEFUL_SERIAL"]
    if serial_ids != expected_serial:
        issues.append("stateful lane is not in dependency order")
    writer = plan.get("SingleWriterPlan")
    if not isinstance(writer, Mapping) or writer.get("Owner") != "TEST_ORCHESTRATOR" or writer.get("WorkerGlobalWritesAllowed") is not False:
        issues.append("global artifact single-writer plan is invalid")
    elif writer.get("GlobalArtifacts") != list(GLOBAL_ARTIFACTS):
        issues.append("global artifact single-writer inventory is incomplete")
    return issues


def deduplicate_evidence(evidence: Iterable[Mapping[str, object]]) -> dict:
    unique: dict[str, dict] = {}
    duplicate_count = 0
    conflicts: list[dict] = []
    for item in evidence:
        record = deepcopy(dict(item))
        evidence_id = record.get("EvidenceId")
        if not evidence_id:
            material = {key: record.get(key) for key in ("WorkerId", "TestCaseId", "Path", "Type")}
            evidence_id = "EVID-" + hashlib.sha256(json.dumps(material, sort_keys=True).encode("utf-8")).hexdigest()[:16]
            record["EvidenceId"] = evidence_id
        if evidence_id not in unique:
            unique[str(evidence_id)] = record
        elif unique[str(evidence_id)] == record:
            duplicate_count += 1
        else:
            conflicts.append({"EvidenceId": evidence_id, "Records": [unique[str(evidence_id)], record]})
    return {"Evidence": list(unique.values()), "DuplicateCount": duplicate_count, "Conflicts": conflicts}


def validate_evidence_records(
    evidence: Iterable[Mapping[str, object]],
    known_assignments: Mapping[str, str] | None = None,
) -> list[str]:
    records = [dict(item) for item in evidence]
    issues: list[str] = []
    seen: set[str] = set()
    for record in records:
        evidence_id = record.get("EvidenceId")
        worker_id = record.get("WorkerId")
        case_id = record.get("TestCaseId")
        path = record.get("Path")
        if not all(isinstance(value, str) and value for value in (evidence_id, worker_id, case_id, path)):
            issues.append("evidence requires EvidenceId, WorkerId, TestCaseId, and Path")
            continue
        if evidence_id in seen:
            issues.append(f"duplicate EvidenceId: {evidence_id}")
        seen.add(evidence_id)
        expected_prefix = f"runs/"
        worker_segment = f"/workers/{worker_id}/"
        if not path.startswith(expected_prefix) or worker_segment not in path.replace("\\", "/"):
            issues.append(f"{evidence_id} path is not worker-owned")
        if known_assignments is not None and known_assignments.get(case_id) != worker_id:
            issues.append(f"{evidence_id} does not match the case assignment")
    return issues


def reconcile_results(results: Iterable[Mapping[str, object]]) -> dict:
    attempts = [deepcopy(dict(result)) for result in results]
    grouped: dict[str, list[dict]] = defaultdict(list)
    invalid: list[str] = []
    for result in attempts:
        case_id = result.get("TestCaseId")
        status = result.get("FinalStatus")
        if not isinstance(case_id, str) or not case_id:
            invalid.append("result missing TestCaseId")
            continue
        if status not in FINAL_STATUSES:
            invalid.append(f"{case_id} has invalid FinalStatus: {status}")
        missing = [field for field in RESULT_FIELDS if field not in result]
        if missing:
            invalid.append(f"{case_id} result missing fields: {missing}")
        grouped[case_id].append(result)
    conflicts: list[dict] = []
    canonical: list[dict] = []
    retry_count = 0
    duplicate_formal_results = 0
    for case_id, records in grouped.items():
        workers = {record.get("WorkerId") for record in records}
        attempts_by_number = [record.get("Attempt") for record in records]
        is_retry_set = (
            len(records) > 1
            and len(workers) == 1
            and all(isinstance(attempt, int) and not isinstance(attempt, bool) and attempt > 0 for attempt in attempts_by_number)
            and len(set(attempts_by_number)) == len(records)
        )
        if is_retry_set:
            retry_count += len(records) - 1
            canonical.append(max(records, key=lambda record: record["Attempt"]))
        elif len(records) > 1:
            duplicate_formal_results += len(records) - 1
            conflicts.append({"TestCaseId": case_id, "Category": "RESULT_CONFLICT", "Results": records})
        else:
            canonical.append(records[0])
    counts = {status: sum(1 for result in canonical if result.get("FinalStatus") == status) for status in sorted(FINAL_STATUSES)}
    if invalid:
        status = "ERROR"
    elif conflicts:
        status = "RESULT_CONFLICT"
    elif not canonical:
        status = "SKIPPED"
    else:
        precedence = ("ERROR", "FAIL", "BLOCKED", "MANUAL", "SKIPPED", "PASS")
        status = next(candidate for candidate in precedence if counts[candidate])
    return {
        "Status": status,
        "CanonicalResults": canonical,
        "Attempts": attempts,
        "Counts": counts,
        "DuplicateFormalResult": duplicate_formal_results,
        "RetryCount": retry_count,
        "Conflicts": conflicts,
        "ValidationIssues": invalid,
    }


def validate_reconciled_results(reconciled: Mapping[str, object]) -> list[str]:
    issues = list(reconciled.get("ValidationIssues", []))
    if reconciled.get("DuplicateFormalResult", 0) and reconciled.get("Status") != "RESULT_CONFLICT":
        issues.append("duplicate formal results must produce RESULT_CONFLICT")
    counts = reconciled.get("Counts", {})
    canonical = reconciled.get("CanonicalResults", [])
    for status in FINAL_STATUSES:
        expected = sum(1 for result in canonical if result.get("FinalStatus") == status)
        if counts.get(status) != expected:
            issues.append(f"reconciled count mismatch for {status}")
    return issues


def _as_list(value: object) -> list:
    if value is None:
        return []
    return list(value) if isinstance(value, (list, tuple, set)) else [value]


def deduplicate_defects(defects: Iterable[Mapping[str, object]]) -> dict:
    identity_fields = ("Feature", "Operation", "EndpointOrPage", "FailureCategory", "NormalizedFailureSignature")
    merged: dict[tuple, dict] = {}
    merged_count = 0
    for defect in defects:
        incoming = deepcopy(dict(defect))
        fingerprint = tuple(incoming.get(field) for field in identity_fields)
        if fingerprint not in merged:
            incoming["Fingerprint"] = hashlib.sha256(json.dumps(fingerprint, ensure_ascii=False).encode("utf-8")).hexdigest()
            incoming["MergedDefectIds"] = _as_list(incoming.get("DefectId"))
            for field in ("TestCaseIds", "WorkerIds", "Attempts", "EvidenceRefs"):
                incoming[field] = list(dict.fromkeys(_as_list(incoming.get(field))))
            if incoming.get("TestCaseId"):
                incoming["TestCaseIds"] = list(dict.fromkeys(incoming["TestCaseIds"] + [incoming["TestCaseId"]]))
            if incoming.get("WorkerId"):
                incoming["WorkerIds"] = list(dict.fromkeys(incoming["WorkerIds"] + [incoming["WorkerId"]]))
            merged[fingerprint] = incoming
            continue
        current = merged[fingerprint]
        merged_count += 1
        current["MergedDefectIds"] = list(dict.fromkeys(current["MergedDefectIds"] + _as_list(incoming.get("DefectId"))))
        for field, singular in (("TestCaseIds", "TestCaseId"), ("WorkerIds", "WorkerId"), ("Attempts", None), ("EvidenceRefs", None)):
            values = _as_list(incoming.get(field))
            if singular and incoming.get(singular):
                values.append(incoming[singular])
            current[field] = list(dict.fromkeys(current[field] + values))
    return {"Defects": list(merged.values()), "MergedCount": merged_count}
