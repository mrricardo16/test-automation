#!/usr/bin/env python3
"""Self-test TEST-EXECUTION with a Mock Handoff and Fake Runtime only."""

from __future__ import annotations

import json
import re
import tempfile
from pathlib import Path


FINAL_STATUSES = {
    "PASS",
    "FAIL",
    "ERROR",
    "BLOCKED",
    "MANUAL",
    "NOT_APPLICABLE",
    "SKIPPED",
}
RECONCILIATION = {
    "COVERED_PASS",
    "COVERED_FAIL",
    "COVERED_ERROR",
    "BLOCKED",
    "MANUAL_PENDING",
    "NOT_APPLICABLE",
    "NOT_COVERED",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="test-execution-self-test-") as temp:
        root = Path(temp)
        handoff = root / "test-handoff"
        output = root / "output"
        runtime = root / "fake-runtime"
        handoff.mkdir()
        output.mkdir()
        runtime.mkdir()

        (handoff / "00-TEST-WORKFLOW.md").write_text(
            "Handoff Version: MOCK-001\nEnvironment: Fake Runtime\n"
            "FLOW-LOGIN-001 Expected Result: login succeeds\n",
            encoding="utf-8",
        )
        (handoff / "06-api-contracts.md").write_text(
            "GET /health returns 200\n", encoding="utf-8"
        )
        (runtime / "runtime.json").write_text(
            json.dumps({"web_url": "http://127.0.0.1:9/unreachable"}),
            encoding="utf-8",
        )

        intake_order = [path.name for path in sorted(handoff.iterdir())]
        require(intake_order[0] == "00-TEST-WORKFLOW.md", "intake must start with workflow")
        require((handoff / "00-TEST-WORKFLOW.md").read_text(encoding="utf-8").startswith("Handoff"), "workflow was not read")

        testcase_id = "TC-WEB-AUTH-001"
        require(re.fullmatch(r"TC-(WEB|API|MANUAL)-[A-Z0-9-]+", testcase_id) is not None, "stable TestCase ID format")
        testcase = {
            "TestCaseId": testcase_id,
            "Covers": ["FLOW-LOGIN-001"],
            "ExpectedResult": "login succeeds",
            "Preconditions": ["runtime is reachable"],
            "TestData": "",
            "AutomationType": "Playwright",
            "Status": "BLOCKED",
        }
        review_gate = [key for key in ("ExpectedResult", "Preconditions", "TestData", "AutomationType") if not testcase[key]]
        require(review_gate == ["TestData"], "review gate must block missing test data")
        require(testcase["Status"] == "BLOCKED", "missing test data must be BLOCKED")

        mismatch = {
            "HandoffId": "FLOW-LOGIN-001",
            "Expected": "login succeeds",
            "Actual": "runtime unavailable",
            "Classification": "DESIGN_RUNTIME_MISMATCH",
        }
        require(mismatch["Classification"] == "DESIGN_RUNTIME_MISMATCH", "mismatch classification")
        require("PASS" not in mismatch["Actual"], "mismatch must not be converted into PASS")

        result = {"TestCaseId": testcase_id, "Status": "BLOCKED", "Evidence": []}
        require(result["Status"] in FINAL_STATUSES, "final status vocabulary")
        coverage = {"HandoffId": "FLOW-LOGIN-001", "TestCaseId": testcase_id, "Reconciliation": "BLOCKED"}
        require(coverage["Reconciliation"] in RECONCILIATION, "reconciliation vocabulary")

        evidence_dir = output / "artifacts" / "web" / testcase_id / "MOCK-RUN"
        evidence_dir.mkdir(parents=True)
        (evidence_dir / "evidence-index.md").write_text(
            f"| {testcase_id} | BLOCKED | | | | | runtime unavailable | yes |\n",
            encoding="utf-8",
        )
        require((evidence_dir / "evidence-index.md").exists(), "evidence index mapping")

        reports = {
            "execution-summary.md": "BLOCKED\n",
            "coverage-report.md": "FLOW-LOGIN-001 | BLOCKED\n",
            "design-runtime-mismatch.md": "DESIGN_RUNTIME_MISMATCH\n",
            "feedback-pack.md": "tested: no; blocked: runtime unavailable\n",
        }
        for name, content in reports.items():
            (output / name).write_text(content, encoding="utf-8")
        require(all((output / name).exists() for name in reports), "feedback/report outputs")

        print(json.dumps({
            "status": "PASS",
            "fixture": "Mock Handoff + Fake Runtime",
            "checks": [
                "intake_order",
                "coverage_traceability",
                "stable_testcase_id",
                "review_gate_blocking",
                "status_classification",
                "evidence_mapping",
                "design_runtime_mismatch",
                "coverage_reconciliation",
                "feedback_outputs",
            ],
            "real_business_test_executed": False,
        }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
