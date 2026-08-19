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
]
REQUIRED_TEMPLATES = [
    "coverage-matrix.md",
    "web-testcase.md",
    "api-testcase.md",
    "manual-testcase.md",
    "regression-report.md",
    "coverage-report.md",
    "defect-list.md",
    "design-runtime-mismatch.md",
    "execution-summary.md",
    "manual-boundaries.md",
    "evidence-index.md",
    "environment-issues.md",
]
STATUSES = ["PASS", "FAIL", "ERROR", "BLOCKED", "MANUAL", "NOT_APPLICABLE", "SKIPPED"]


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
        "credentials",
    ]
    for phrase in required_phrases:
        if phrase not in content:
            fail(f"required contract phrase missing: {phrase}")
    for status in STATUSES:
        if status not in content:
            fail(f"required final status missing: {status}")
    if "NOT_COVERED" not in content or "P0" not in content:
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
    if not (skill / "scripts" / "self_test.py").exists():
        fail("scripts/self_test.py is missing")

    print(f"PASS: {skill}")
    print(f"references={len(REQUIRED_REFERENCES)} templates={len(REQUIRED_TEMPLATES)} statuses={len(STATUSES)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, UnicodeDecodeError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
