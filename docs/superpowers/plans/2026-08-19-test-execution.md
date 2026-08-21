# TEST-EXECUTION Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to execute this plan task-by-task.

**Goal:** Implement a reusable `TEST-EXECUTION` Codex Skill that consumes a validated `DEV-TEST-HANDOFF` pack and executes or plans black-box Web, API, and Manual testing without reading product source.

**Architecture:** Keep the Skill entrypoint concise and put detailed contracts in linked reference Markdown files. Use reusable templates for TestCases, coverage, evidence, reports, and feedback. Use repository-local Python self-tests and contract validation against a minimal Mock Handoff/Fake Runtime fixture.

**Tech Stack:** UTF-8 Markdown, YAML, Python 3 standard library, Playwright guidance, existing repository evidence helper conventions.

## Global Constraints

- Do not modify product source, the Expected Handoff baseline, or existing business automation during this task.
- Do not execute a real URL, API, browser acceptance run, Word generation, or real business test.
- Keep credentials out of tracked files; use environment variables or ignored local configuration only.
- Preserve all existing dirty work and stage only files belonging to this Skill and its implementation plan.
- Use only the repository statuses `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, `NOT_APPLICABLE`, and `SKIPPED` in the Skill contract.

## Task 1: Establish RED pressure scenarios

1. Create a temporary fixture outside the repository at `%TEMP%\\test-execution-baseline` containing a minimal handoff with missing inputs, an incomplete flow, a design/runtime mismatch, and a fake runtime with no real endpoint.
2. Record expected failure decisions in a temporary scenario file; do not add the fixture to Git.
3. Run the scenario evaluator before the Skill exists and capture the baseline as RED/unsupported behavior.

## Task 2: Initialize the Skill skeleton

1. Run the official Skill initializer for `E:/automated-testing/skills/test-execution`.
2. Replace generated placeholder content with a concise `SKILL.md` whose description begins with `Use when...` and whose workflow covers intake, coverage, TestCase-first design, review gate, execution, evidence, reconciliation, reporting, and development feedback.
3. Add `agents/openai.yaml` with discoverable display metadata and a default prompt that explicitly consumes `test-handoff/` and does not require product source.
4. Remove unused generated directories or placeholder files without touching `skills/dev-test-handoff`.

## Task 3: Add detailed contracts and templates

1. Add the eight required reference files: black-box contract, coverage/traceability, execution rules, evidence rules, test data/cleanup, feedback contract, runtime health/errors, and security sanitization.
2. Add templates for coverage matrix, Web/API/Manual TestCases, regression report, coverage report, defect list, design-runtime mismatch, execution summary, manual boundaries, evidence index, and environment issues.
3. Link every reference and template from `SKILL.md`; avoid unsupported claims and preserve exact status/ID terminology.

## Task 4: Implement the Skill self-test and contract validator

1. Add `scripts/self_test.py` that creates a minimal Mock Handoff and Fake Runtime in a temporary directory, then verifies intake order, coverage traceability, stable TestCase IDs, review-gate blocking, status classification, evidence mapping, mismatch reporting, reconciliation, and feedback output.
2. Add `scripts/validate_contract.py` that checks required files, required phrases, status vocabulary, no-source/no-credential rules, and template links.
3. Run both scripts before completing implementation; fix failures surgically and rerun.

## Task 5: GREEN verification and delivery

1. Run the official `quick_validate.py` against `skills/test-execution`.
2. Re-run the pressure scenarios using the completed Skill contract and confirm the expected safe classifications.
3. Verify all new Markdown, YAML, and Python files are UTF-8 and run `git diff --check` on only the intended staged files.
4. Inspect `git status --short` and confirm unrelated existing changes remain unstaged.
5. Commit only the implementation plan and `skills/test-execution/**` files in intentional commits; do not push without fresh explicit authorization.

## Self-review checklist

- [ ] The Skill is discoverable and has one clear trigger description.
- [ ] The Skill does not require product source and treats the Handoff Expected baseline as read-only.
- [ ] TestCase-first, review gate, execution layers, evidence, data safety, statuses, mismatch, reconciliation, and feedback are all explicit.
- [ ] The self-test uses only Mock Handoff/Fake Runtime fixtures and never a real business project.
- [ ] All references are linked and all generated content is complete, UTF-8, and free of placeholders.
- [ ] Validation evidence is recorded before claiming completion.
