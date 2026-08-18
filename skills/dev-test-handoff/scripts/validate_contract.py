"""Read-only structural validation for a generated dev-test-handoff output root."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


AS_BUILT_FILES = [
    "00-index.md",
    "01-system-overview.md",
    "02-frontend-design.md",
    "03-backend-design.md",
    "04-module-inventory.md",
    "05-page-route-map.md",
    "06-api-design.md",
    "07-frontend-backend-mapping.md",
    "08-business-rules.md",
    "09-business-flows.md",
    "10-auth-permission.md",
    "11-validation-rules.md",
    "12-state-model.md",
    "13-data-and-external-dependencies.md",
    "14-error-behavior.md",
    "15-known-unknowns.md",
    "16-design-coverage.md",
]

HANDOFF_FILES = [
    "00-TEST-WORKFLOW.md",
    "01-scope.md",
    "02-module-inventory.md",
    "03-page-route-map.md",
    "04-business-rules.md",
    "05-business-flows.md",
    "06-api-contracts.md",
    "07-validation-rules.md",
    "08-auth-permission.md",
    "09-state-model.md",
    "10-test-data-contract.md",
    "11-testability-map.md",
    "12-error-behavior.md",
    "13-risk-priority.md",
    "14-manual-boundaries.md",
    "15-known-issues-and-limitations.md",
    "16-coverage-contract.md",
    "17-traceability-matrix.md",
    "18-runtime-observability.md",
]

ID_PATTERN = re.compile(r"\b(?:MOD|FEAT|RULE|FLOW|API|VALID|STATE)-[A-Z0-9][A-Z0-9-]*\b")
SUSPICIOUS_ASSIGNMENT = re.compile(
    r"\b(?:password|passwd|secret|api[_-]?key|token|cookie|connectionstring)\b\s*[:=]\s*"
    r"(?!<|UNKNOWN\b|NOT_APPLICABLE\b|REDACTED\b|\[REDACTED\])[^\s|`]+",
    re.IGNORECASE,
)


def _read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError(f"not UTF-8: {path}") from exc


def _require_files(root: Path, relative_files: list[str], failures: list[str]) -> None:
    for relative_file in relative_files:
        path = root / relative_file
        if not path.is_file():
            failures.append(f"missing file: {path}")


def validate_output(output_root: Path) -> list[str]:
    """Return validation failures without changing output_root."""

    failures: list[str] = []
    as_built = output_root / "as-built"
    handoff = output_root / "test-handoff"
    _require_files(as_built, AS_BUILT_FILES, failures)
    _require_files(handoff, HANDOFF_FILES, failures)

    index = as_built / "00-index.md"
    coverage = as_built / "16-design-coverage.md"
    workflow = handoff / "00-TEST-WORKFLOW.md"
    handoff_coverage = handoff / "16-coverage-contract.md"
    traceability = handoff / "17-traceability-matrix.md"

    for path, marker, label in (
        (index, "As-Built", "As-Built index marker"),
        (workflow, "TestCase", "Handoff TestCase boundary marker"),
        (handoff_coverage, "Coverage", "Coverage Contract marker"),
        (traceability, "MOD-", "Traceability ID marker"),
    ):
        if path.is_file():
            content = _read_text(path)
            if marker not in content:
                failures.append(f"missing {label}: {path}")

    coverage_text = _read_text(coverage) if coverage.is_file() else ""
    if "PASS" not in coverage_text and "DESIGN_BASELINE_INCOMPLETE" not in coverage_text:
        failures.append(f"missing Design Gate result marker: {coverage}")

    as_built_text = "\n".join(_read_text(path) for path in as_built.rglob("*.md") if path.is_file())
    handoff_text = "\n".join(_read_text(path) for path in handoff.rglob("*.md") if path.is_file())
    as_built_ids = set(ID_PATTERN.findall(as_built_text))
    handoff_ids = set(ID_PATTERN.findall(handoff_text))
    missing_ids = sorted(handoff_ids - as_built_ids)
    if missing_ids:
        failures.append("Handoff IDs missing from As-Built: " + ", ".join(missing_ids))

    all_text = as_built_text + "\n" + handoff_text
    suspicious = sorted(set(SUSPICIOUS_ASSIGNMENT.findall(all_text)))
    if suspicious:
        failures.append("possible unsanitized sensitive assignments: " + ", ".join(suspicious))

    if "DESIGN_RUNTIME_MISMATCH" in handoff_text and "DESIGN_RUNTIME_MISMATCH" not in as_built_text:
        failures.append("runtime mismatch marker lacks an As-Built baseline reference")
    if "DESIGN_BASELINE_INCOMPLETE" in coverage_text and "HANDOFF_LIMITED_BY_DESIGN_GAPS" not in handoff_text:
        failures.append("incomplete Design Gate requires HANDOFF_LIMITED_BY_DESIGN_GAPS in Handoff")

    return failures


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate a dev-test-handoff output root without modifying it.")
    parser.add_argument("output_root", type=Path, nargs="?", help="generated output root")
    args = parser.parse_args(argv)
    if args.output_root is None:
        parser.print_help(sys.stderr)
        return 2
    failures = validate_output(args.output_root)
    if failures:
        for failure in failures:
            print(f"FAIL: {failure}", file=sys.stderr)
        return 1
    print("CONTRACT=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
