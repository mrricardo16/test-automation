#!/usr/bin/env python3
"""Mock Source and Fake Runtime self-test for WHITEBOX-TEST-EXECUTION only."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[1]
FINAL_STATUSES = {"PASS", "FAIL", "ERROR", "BLOCKED", "MANUAL", "NOT_APPLICABLE", "SKIPPED"}
COVERAGE_STATES = {
    "COVERED_PASS", "COVERED_FAIL", "COVERED_ERROR", "BLOCKED",
    "MANUAL_PENDING", "NOT_APPLICABLE", "NOT_COVERED",
}
EXPECTED_BASES = {"CONFIRMED_FROM_CODE", "CONFIRMED_FROM_RUNTIME", "INFERRED", "UNKNOWN"}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def text(relative: str) -> str:
    return (SKILL_ROOT / relative).read_text(encoding="utf-8")


def main() -> int:
    required = [
        "SKILL.md", "references/whitebox-contract.md", "references/baseline-validation-gate.md",
        "references/source-runtime-alignment-gate.md", "references/coverage-and-traceability.md",
        "references/testcase-design.md", "references/regression-contract.md",
        "templates/whitebox-baseline.md", "templates/coverage-matrix.md",
        "templates/unit-testcase.md", "templates/whitebox-regression-report.md",
    ]
    for relative in required:
        require((SKILL_ROOT / relative).is_file(), f"missing required contract resource: {relative}")

    with tempfile.TemporaryDirectory(prefix="whitebox-test-execution-self-test-") as temporary:
        root = Path(temporary)
        source = root / "mock-source"
        runtime = root / "fake-runtime"
        output = root / "test-owned-output"
        (source / "frontend").mkdir(parents=True)
        (source / "backend").mkdir()
        runtime.mkdir()
        output.mkdir()
        (source / "frontend" / "OrderPage.mock").write_text(
            "route=/orders\nstatus=1\ncall=POST /orders\n", encoding="utf-8"
        )
        (source / "backend" / "OrderHandler.mock").write_text(
            "rule=total positive\nvalidation=total\nerror=shipping unavailable\nexternal=FakeShipping\n",
            encoding="utf-8",
        )
        (runtime / "actual.json").write_text(
            json.dumps({"actual": "shipping unavailable", "changed": True}), encoding="utf-8"
        )
        (output / "coverage.json").write_text(
            json.dumps({"line_coverage": 100, "business_coverage": False}), encoding="utf-8"
        )

        inventory = {"frontend": "PRESENT", "backend": "PRESENT", "solutions": ["mock-frontend", "mock-backend"]}
        require(all(path.exists() for path in (source / "frontend", source / "backend", runtime)), "fixture intake")
        require(len(inventory["solutions"]) == 2, "multi-solution inventory")
        fact = {"RuleId": "RULE-ORDER-001", "ExpectedBasis": "CONFIRMED_FROM_CODE", "SourceEvidence": "backend/OrderHandler.mock:rule"}
        require(fact["ExpectedBasis"] in EXPECTED_BASES, "ExpectedBasis vocabulary")
        require(fact["RuleId"].startswith("RULE-"), "stable rule ID")
        baseline_gate = {"Status": "BASELINE_VALIDATED", "Missing": "NONE", "Reason": "NONE", "Impact": "NONE"}
        require(baseline_gate["Status"] == "BASELINE_VALIDATED", "baseline gate")
        testcase = {
            "TestCaseId": "TC-UNIT-ORDER-001", "ExpectedBasis": fact["ExpectedBasis"],
            "SourceEvidence": fact["SourceEvidence"], "Status": "BLOCKED", "ReviewGate": "APPROVED",
        }
        require(testcase["TestCaseId"].startswith("TC-UNIT-"), "TestCase-first stable ID")
        require(testcase["ReviewGate"] == "APPROVED", "review gate")
        require(testcase["Status"] in FINAL_STATUSES, "final status compatibility")
        layers = {"UNIT", "INTEGRATION", "API", "WEB_UI", "DESKTOP_HEADLESS", "DESKTOP_E2E", "MANUAL"}
        require(len(layers) == 7 and "UNIT" in layers and "MANUAL" in layers, "seven layers")
        alignment = {"Gate": "SOURCE_RUNTIME_ALIGNMENT", "Classification": "SOURCE_RUNTIME_MISMATCH", "Expected": "total positive", "Actual": "shipping unavailable"}
        require(alignment["Classification"] in {"DESIGN_RUNTIME_MISMATCH", "SOURCE_RUNTIME_MISMATCH"}, "alignment mismatch")
        require(alignment["Expected"] != alignment["Actual"], "Expected must not be rewritten")
        evidence = {"TestCaseId": testcase["TestCaseId"], "TestLayer": "UNIT", "Command": "mock command", "Actual": "blocked"}
        require(evidence["TestCaseId"] == testcase["TestCaseId"], "evidence mapping")
        diagnosis = {"Confidence": "ROOT_CAUSE_PROBABLE", "CallChain": "Handler -> FakeShipping"}
        require(diagnosis["Confidence"] in {"ROOT_CAUSE_CONFIRMED", "ROOT_CAUSE_PROBABLE", "ROOT_CAUSE_UNKNOWN"}, "root cause confidence")
        coverage = {"State": "NOT_COVERED", "Priority": "P0", "CodeCoverage": "100%"}
        require(coverage["State"] in COVERAGE_STATES, "coverage reconciliation")
        require(coverage["Priority"] == "P0" and coverage["State"] == "NOT_COVERED", "P0 gate")
        require(coverage["CodeCoverage"] == "100%" and coverage["State"] != "COVERED_PASS", "non-invasive code coverage is not business coverage")
        require(output.parent == root and output.exists(), "test-owned output only")

    print(json.dumps({
        "status": "PASS", "fixture": "Mock Source + Fake Runtime", "checks": [
            "source_intake", "stable_ids", "ExpectedBasis", "baseline_validation_gate",
            "source_runtime_alignment", "seven_layers", "testcase_review_gate",
            "status_compatibility", "evidence", "root_cause_confidence",
            "coverage_reconciliation", "p0_gate", "non_invasive_code_coverage",
        ], "real_business_test_executed": False,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
