#!/usr/bin/env python3
"""Static contract validator for the TEST-EXECUTION Skill."""

from __future__ import annotations

import re
import sys
from pathlib import Path


REQUIRED_REFERENCES = [
    "black-box-contract.md",
    "coverage-and-traceability.md",
    "execution-rules.md",
    "evidence-rules.md",
    "test-data-and-cleanup.md",
    "feedback-contract.md",
    "runtime-health-and-errors.md",
    "security-sanitization.md",
    "multi-agent-orchestration.md",
    "resource-lock-model.md",
    "worker-contract.md",
    "result-reconciliation.md",
    "cleanup-ownership.md",
]
REQUIRED_TEMPLATES = [
    "coverage-matrix.md",
    "web-testcase.md",
    "api-testcase.md",
    "manual-testcase.md",
    "regression-report.md",
    "coverage-report.md",
    "defect-list.md",
    "defect-feedback.md",
    "design-runtime-mismatch.md",
    "execution-summary.md",
    "manual-boundaries.md",
    "evidence-index.md",
    "environment-issues.md",
]
STATUSES = ["PASS", "FAIL", "ERROR", "BLOCKED", "MANUAL", "SKIPPED"]
REQUIRED_SCRIPTS = ["self_test.py", "orchestrator.py", "orchestration_self_test.py"]


def fail(message: str) -> None:
    raise AssertionError(message)


def main() -> int:
    skill = Path(__file__).resolve().parents[1]
    skill_md = skill / "SKILL.md"
    if not skill_md.exists():
        fail("SKILL.md is missing")
    content = skill_md.read_text(encoding="utf-8")
    if not re.search(r"^name: test-execution$", content, re.MULTILINE):
        fail("frontmatter name must be test-execution")
    description = re.search(r'^description: "([^"]+)"$', content, re.MULTILINE)
    if not description or not description.group(1).startswith("Use when"):
        fail("description must start with Use when")
    if "TODO" in content or "[TODO" in content:
        fail("placeholder TODO remains in SKILL.md")
    required_phrases = [
        "00-TEST-WORKFLOW.md",
        "product source",
        "read-only",
        "TestCase",
        "Review Gate",
        "Playwright",
        "DESIGN_RUNTIME_MISMATCH",
        "BLOCKED_TEST_DATA",
        "evidence-index.md",
        "feedback",
        "DefectId",
        "defect-feedback.md",
        "ExecutionStatus",
        "CoverageStatus",
        "GateStatus",
        "Reproduction",
        "Expected",
        "Actual",
        "Evidence",
        "Regression scope",
        "Next action",
        "credentials",
        "contracts/status-contract.md",
        "contracts/testcase-contract.md",
        "LegacyFieldAdapter",
        "ApplicabilityStatus",
        "CoverageStatus",
        "TEST_ORCHESTRATOR",
        "INDEPENDENT_TEST_WORKER",
        "STATEFUL_TEST_WORKER",
        "INDEPENDENT_PARALLEL",
        "STATEFUL_SERIAL",
        "SAFETY_BLOCKED",
        "PARALLEL_PHASE_RECONCILIATION_GATE",
        "Execution Snapshot",
        "ResourceLocks",
        "TestDataNamespace",
        "ArtifactRoot",
        "SAFE_STOP",
        "RESULT_CONFLICT",
        "single writer",
        "GlobalReportWrites",
        "deduplicate",
    ]
    for phrase in required_phrases:
        if phrase not in content:
            fail(f"required contract phrase missing: {phrase}")
    for status in STATUSES:
        if status not in content:
            fail(f"required final status missing: {status}")
    if "NOT_APPLICABLE" not in content or "CoverageStatus" not in content:
        fail("NOT_APPLICABLE must remain a separate applicability/coverage value")
    if "P0" not in content or not ("UNTESTED" in content or "NOT_COVERED" in content):
        fail("P0 coverage gate missing")

    for folder, names in (("references", REQUIRED_REFERENCES), ("templates", REQUIRED_TEMPLATES)):
        for name in names:
            path = skill / folder / name
            if not path.exists():
                fail(f"missing {folder}/{name}")
            text = path.read_text(encoding="utf-8")
            if "TODO" in text or "TBD" in text:
                fail(f"placeholder remains in {folder}/{name}")
            if not text.strip():
                fail(f"empty file: {folder}/{name}")

    for link in re.findall(r"\]\((references|templates)/([^)]*)\)", content):
        path = skill / link[0] / link[1]
        if not path.exists():
            fail(f"broken Skill link: {link[0]}/{link[1]}")

    if not (skill / "agents" / "openai.yaml").exists():
        fail("agents/openai.yaml is missing")
    for name in REQUIRED_SCRIPTS:
        if not (skill / "scripts" / name).exists():
            fail(f"scripts/{name} is missing")

    if re.search(r"\b(max_subagents|max_workers|agent_concurrency|global_concurrency)\s*=", "\n".join(
        path.read_text(encoding="utf-8") for path in [skill / "SKILL.md", *(skill / "scripts").glob("*.py")]
    ), re.IGNORECASE):
        fail("Skill must not define global agent capacity")

    print(f"PASS: {skill}")
    print(f"references={len(REQUIRED_REFERENCES)} templates={len(REQUIRED_TEMPLATES)} statuses={len(STATUSES)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, UnicodeDecodeError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
