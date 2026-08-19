#!/usr/bin/env python3
"""Static contract validation for WHITEBOX-TEST-EXECUTION."""
from __future__ import annotations
import re
import sys
from pathlib import Path

REFERENCES = ["whitebox-contract.md", "source-analysis-and-risk.md", "baseline-validation-gate.md", "source-runtime-alignment-gate.md", "coverage-and-traceability.md", "test-layer-selection.md", "testcase-design.md", "harness-safety.md", "evidence-rules.md", "root-cause-analysis.md", "test-data-and-cleanup.md", "regression-contract.md", "security-sanitization.md"]
TEMPLATES = ["whitebox-baseline.md", "coverage-matrix.md", "unit-testcase.md", "integration-testcase.md", "api-testcase.md", "web-testcase.md", "desktop-testcase.md", "manual-testcase.md", "whitebox-regression-report.md", "coverage-report.md", "defect-list.md", "root-cause-analysis.md", "execution-summary.md", "evidence-index.md", "environment-issues.md", "manual-boundaries.md"]
REQUIRED = ["Source Intake", "White-box Analysis", "Test Baseline", "Coverage", "TestCase", "Review Gate", "Layer Selection", "Harness", "Runtime Health", "Execution", "Evidence", "Failure Diagnosis", "Reconciliation", "Reporting", "ExpectedBasis", "CONFIRMED_FROM_CODE", "CONFIRMED_FROM_RUNTIME", "INFERRED", "UNKNOWN", "BASELINE_VALIDATED", "BASELINE_INCOMPLETE", "SOURCE_RUNTIME_ALIGNMENT", "DESIGN_RUNTIME_MISMATCH", "SOURCE_RUNTIME_MISMATCH", "CODE_COVERAGE_NON_INVASIVE", "dev-test-handoff", "test-execution", "product source", "read-only"]
STATUSES = ["PASS", "FAIL", "ERROR", "BLOCKED", "MANUAL", "NOT_APPLICABLE", "SKIPPED"]
COVERAGE = ["COVERED_PASS", "COVERED_FAIL", "COVERED_ERROR", "MANUAL_PENDING", "NOT_COVERED"]

def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)

def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")

def main() -> int:
    root = Path(__file__).resolve().parents[1]
    skill = root / "SKILL.md"
    content = read(skill)
    require(re.search(r"^name: whitebox-test-execution$", content, re.MULTILINE) is not None, "frontmatter name")
    description = re.search(r"^description: (.+)$", content, re.MULTILINE)
    require(description is not None and description.group(1).startswith("Use when"), "Use when description")
    reference_text = "\n".join(read(root / "references" / name) for name in REFERENCES if (root / "references" / name).is_file())
    for marker in REQUIRED + STATUSES + COVERAGE:
        require(marker in content or marker in reference_text, f"missing marker: {marker}")
    require((root / "agents" / "openai.yaml").is_file(), "missing agents/openai.yaml")
    require((root / "scripts" / "self_test.py").is_file(), "missing self_test.py")
    all_text = reference_text + "\n" + content
    for folder, names in (("references", REFERENCES), ("templates", TEMPLATES)):
        for name in names:
            path = root / folder / name
            require(path.is_file(), f"missing {folder}/{name}")
            file_text = read(path)
            require(file_text.strip(), f"empty {folder}/{name}")
            all_text += "\n" + file_text
    for folder, name in re.findall(r"\]\((references|templates)/([^)]*)\)", content):
        require((root / folder / name).is_file(), f"broken link: {folder}/{name}")
    require("TODO" not in all_text and "TBD" not in all_text, "placeholder present")
    forbidden = re.compile(r"(?:[A-Za-z]:\\(?:logclient|HZ_|svn)|https?://|password\s*[:=]|api[_-]?key\s*[:=]|token\s*[:=])", re.IGNORECASE)
    require(forbidden.search(all_text) is None, "credential, real-business-path, or real URL literal")
    print(f"PASS: {root}")
    print(f"references={len(REFERENCES)} templates={len(TEMPLATES)} statuses={len(STATUSES)}")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, UnicodeDecodeError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
