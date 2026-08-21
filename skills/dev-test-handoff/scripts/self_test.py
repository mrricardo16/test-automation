"""Static self-test for the reusable dev-test-handoff Skill."""

from __future__ import annotations

import tempfile
from pathlib import Path

from validate_contract import AS_BUILT_FILES, HANDOFF_FILES, validate_output


SKILL_ROOT = Path(__file__).resolve().parents[1]


def _write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")


def run() -> None:
    skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
    if "does not generate defect feedback" not in skill_text or "downstream execution Skills" not in skill_text:
        raise AssertionError("handoff must exclude defect feedback ownership and route it downstream")
    for relative in AS_BUILT_FILES:
        if not (SKILL_ROOT / "templates" / "as-built" / relative).is_file():
            raise AssertionError(f"missing As-Built template: {relative}")
    for relative in HANDOFF_FILES:
        if not (SKILL_ROOT / "templates" / "test-handoff" / relative).is_file():
            raise AssertionError(f"missing Handoff template: {relative}")
    for relative in (
        "confidence-and-ids.md",
        "source-analysis-rules.md",
        "design-validation-gate.md",
        "handoff-validation-gate.md",
        "security-sanitization.md",
    ):
        if not (SKILL_ROOT / "references" / relative).is_file():
            raise AssertionError(f"missing reference: {relative}")

    with tempfile.TemporaryDirectory(prefix="dev-test-handoff-self-test-") as temporary:
        output_root = Path(temporary)
        as_built = output_root / "as-built"
        handoff = output_root / "test-handoff"
        for relative in AS_BUILT_FILES:
            _write(as_built / relative, "# As-Built baseline\n")
        for relative in HANDOFF_FILES:
            _write(handoff / relative, "# Handoff\n")
        _write(
            as_built / "00-index.md",
            "# As-Built Design Index\nMOD-ALPHA FEAT-ALPHA RULE-ALPHA FLOW-ALPHA API-ALPHA VALID-ALPHA STATE-ALPHA\n",
        )
        _write(as_built / "16-design-coverage.md", "# Design Gate\nPASS\n")
        _write(handoff / "00-TEST-WORKFLOW.md", "# black-box Test Agent\nTestCase remains test-owned.\n")
        _write(handoff / "16-coverage-contract.md", "# Coverage Contract\n")
        _write(
            handoff / "17-traceability-matrix.md",
            "# Traceability\nMOD-ALPHA FEAT-ALPHA RULE-ALPHA FLOW-ALPHA API-ALPHA VALID-ALPHA STATE-ALPHA\n",
        )
        failures = validate_output(output_root)
        if failures:
            raise AssertionError("; ".join(failures))

        _write(as_built / "16-design-coverage.md", "# Design Gate\nDESIGN_BASELINE_INCOMPLETE\n")
        _write(handoff / "00-TEST-WORKFLOW.md", "# black-box Test Agent\nTestCase remains test-owned.\nHANDOFF_LIMITED_BY_DESIGN_GAPS\n")
        failures = validate_output(output_root)
        if failures:
            raise AssertionError("restricted handoff rejected: " + "; ".join(failures))

    print("SELF_TEST=PASS")


if __name__ == "__main__":
    run()
