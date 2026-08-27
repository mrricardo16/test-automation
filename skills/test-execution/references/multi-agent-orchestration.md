# Multi-Agent Orchestration

Use this reference when a run contains two or more executable TestCases. The run is coordinated by one `TEST_ORCHESTRATOR`; workers execute only an immutable assignment from the same Execution Snapshot.

## Phase model

1. **Design/materialization:** load authority and functional inventory, review the TestCase catalog, complete execution metadata, build the dependency and lock graph, freeze the snapshot, and validate it.
2. **Independent phase:** dispatch only `INDEPENDENT_TEST_WORKER` assignments whose dependencies are satisfied and whose locks are compatible. A worker failure is isolated unless the orchestrator declares `GLOBAL_EXECUTION_STOP`.
3. **Reconciliation gate:** collect every worker result, assignment, evidence index, fixture registry, cleanup record, and proposal. Check ownership, residuals, sessions, locks, snapshot revision, duplicate results, and evidence references.
4. **Stateful serial lane:** after the gate passes, re-check runtime readiness and execute `STATEFUL_TEST_WORKER` cases one at a time in dependency order. Do not reuse mutable worker fixtures by default.
5. **Global cleanup and report:** scan only run-owned namespaces, preserve ownership-unknown data, deduplicate defects, recompute coverage/counts from canonical results, and write the final report once.

The deterministic helper [`scripts/orchestrator.py`](../scripts/orchestrator.py) builds and validates the graph, plan, isolation metadata, result merge, and defect fingerprints. It accepts `available_worker_capacity` as an input supplied by the runtime; it does not define or change global agent capacity.

## Lane decision

| Condition | Lane | ParallelSafety |
| --- | --- | --- |
| Read-only or independently owned data with compatible locks | `INDEPENDENT_PARALLEL` | `PARALLEL_SAFE` or `PARALLEL_SAFE_WITH_NAMESPACE` |
| Mutable shared runtime, physical flow, or dependency-ordered state | `STATEFUL_SERIAL` | `SERIAL_SHARED_STATE` |
| Human visual judgement or unsupported automation | `MANUAL` | `MANUAL_REVIEW_REQUIRED` |
| Unsafe, unowned, or prohibited operation | `SAFETY_BLOCKED` | `SAFETY_BLOCKED` |

Do not infer safety from module/menu locality. Use dependencies, fixture ownership, resource locks, namespace identity, environment dependencies, and side effects. Locality may reduce repeated login/navigation only after it preserves parallel safety.

## Stop and retry rules

Ordinary `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, and `SKIPPED` results do not stop independent assignments. Stop new dispatch on global runtime loss, authentication failure affecting all workers, corruption risk, secret leakage, unexpected device movement, source mutation, critical cleanup risk, or `SNAPSHOT_DRIFT`. Request `SAFE_STOP`; do not force-kill a worker except where immediate safety requires it. Retries preserve every attempt and never change Expected.
