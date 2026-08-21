# DEV-TEST-HANDOFF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and validate the reusable `dev-test-handoff` Codex Skill in the repository without analyzing a real business product or executing tests.

**Architecture:** Use the official Skill Creator layout with a concise workflow `SKILL.md`, generated `agents/openai.yaml`, detailed rule references, Markdown output templates, and two dependency-free Python contract helpers. The Skill enforces `Source → As-Built → Design Gate → Handoff` and keeps identifiers, evidence confidence, unknowns, and sanitization rules intact across the projection.

**Tech Stack:** Markdown, YAML, Python 3 standard library, PowerShell, Git, official `init_skill.py` and `quick_validate.py`.

## Global Constraints

- Modify only `E:\automated-testing`; preserve all existing uncommitted work.
- Keep all Markdown, YAML, Python, and text files UTF-8.
- Do not read or analyze the named real business source projects.
- Do not modify product source, install product dependencies, build/run products, execute Playwright/API/Avalonia tests, or generate formal TestCases.
- Do not include credentials, tokens, cookies, customer data, local business paths, or product source in the Skill.
- Use `skills/dev-test-handoff/` as the repository-local Skill directory.
- Keep `SKILL.md` workflow-focused and under 500 lines; place detailed contracts in `references/` and `templates/`.

## File Map

### New Skill files

- `skills/dev-test-handoff/SKILL.md`: trigger metadata, inputs, staged workflow, stop conditions, and resource routing.
- `skills/dev-test-handoff/agents/openai.yaml`: generated UI metadata.
- `skills/dev-test-handoff/references/confidence-and-ids.md`: evidence vocabulary and stable ID rules.
- `skills/dev-test-handoff/references/source-analysis-rules.md`: framework-neutral staged source analysis and single-/multi-sided scope rules.
- `skills/dev-test-handoff/references/design-validation-gate.md`: Stage A completeness and failure contract.
- `skills/dev-test-handoff/references/handoff-validation-gate.md`: Stage B completeness, traceability, confidence, and layer-selection checks.
- `skills/dev-test-handoff/references/security-sanitization.md`: As-Built-to-Handoff redaction and safe external behavior rules.
- `skills/dev-test-handoff/templates/as-built/*.md`: the 17 As-Built Markdown output contracts.
- `skills/dev-test-handoff/templates/test-handoff/*.md`: the 19 black-box handoff Markdown output contracts.
- `skills/dev-test-handoff/scripts/validate_contract.py`: read-only validation of an already generated output root.
- `skills/dev-test-handoff/scripts/self_test.py`: temporary minimal-fixture validation of Skill resources and contract markers.

### Repository documentation

- `docs/superpowers/specs/2026-08-18-dev-test-handoff-design.md`: approved design, already committed in `74cbe5a`.
- `docs/superpowers/plans/2026-08-18-dev-test-handoff.md`: this implementation plan.

## Task 1: Initialize the official Skill skeleton

**Files:**
- Create: `skills/dev-test-handoff/` using `C:\Users\Administrator\.codex\skills\.system\skill-creator\scripts\init_skill.py`
- Create: `skills/dev-test-handoff/agents/openai.yaml`
- Create: `skills/dev-test-handoff/SKILL.md`

**Interfaces:**
- Consumes: approved design and official Skill Creator initializer.
- Produces: a discoverable Skill folder with required frontmatter scaffolding and `references/`, `templates/`, and `scripts/` directories.

- [ ] **Step 1: Confirm the target does not exist and the initializer is available.**

  Run:

  ```powershell
  Test-Path E:\automated-testing\skills\dev-test-handoff
  Test-Path C:\Users\Administrator\.codex\skills\.system\skill-creator\scripts\init_skill.py
  ```

  Expected: `False` then `True`.

- [ ] **Step 2: Initialize the Skill with official tooling.**

  Run:

  ```powershell
  python C:\Users\Administrator\.codex\skills\.system\skill-creator\scripts\init_skill.py dev-test-handoff --path E:\automated-testing\skills --resources scripts,references --interface display_name="Dev Test Handoff" --interface short_description="Build validated As-Built design and black-box test handoff packs" --interface default_prompt="Use $dev-test-handoff to analyze readable frontend and backend source into a validated As-Built baseline and derive a sanitized Markdown test handoff without executing tests."
  ```

  Expected: the Skill folder, required frontmatter file, `agents/openai.yaml`, `scripts/`, and `references/` exist.

- [ ] **Step 3: Add the repository-owned templates directory.**

  Create the empty `skills/dev-test-handoff/templates/as-built/` and `skills/dev-test-handoff/templates/test-handoff/` directories through the first template patches in Task 3; do not create unrelated directories.

## Task 2: Write references and validation rules

**Files:**
- Create: `skills/dev-test-handoff/references/confidence-and-ids.md`
- Create: `skills/dev-test-handoff/references/source-analysis-rules.md`
- Create: `skills/dev-test-handoff/references/design-validation-gate.md`
- Create: `skills/dev-test-handoff/references/handoff-validation-gate.md`
- Create: `skills/dev-test-handoff/references/security-sanitization.md`

**Interfaces:**
- Consumes: stable names and output contracts from the approved design.
- Produces: directly linked, framework-neutral rules that `SKILL.md` can load only when needed.

- [ ] **Step 1: Write the evidence and identifier reference.**

  Define the four confidence values, evidence precedence, no-confidence-upgrade rule, and exact stable prefixes: `MOD-`, `FEAT-`, `RULE-`, `FLOW-`, `API-`, `VALID-`, and `STATE-`. Define that IDs are immutable across Stage A and Stage B.

- [ ] **Step 2: Write the source-analysis reference.**

  Define six inventory passes, framework-neutral frontend/backend signals, multi-project discovery, frontend-only/backend-only behavior, scope boundaries, and the rule that source facts must not be upgraded into business requirements.

- [ ] **Step 3: Write the Design Gate reference.**

  Define required project/route/API/module/mapping/rule/unknown checks, `NOT_APPLICABLE`, `DESIGN_BASELINE_INCOMPLETE`, `Missing/Reason/Impact`, and restricted handoff marker `HANDOFF_LIMITED_BY_DESIGN_GAPS`.

- [ ] **Step 4: Write the Handoff Gate reference.**

  Define P0/P1 completeness fields, `UNKNOWN` versus `NOT_APPLICABLE`, ID and confidence continuity, `WEB_UI/API/BOTH/MANUAL`, `DESIGN_RUNTIME_MISMATCH`, and the prohibition on formal TestCase generation.

- [ ] **Step 5: Write the sanitization reference.**

  Define internal-detail removal, secret/key/password/token/cookie/connection-string redaction, local-path removal, preservation of externally testable contracts, destructive-operation safeguards, and “only test-created data may be automatically deleted.”

## Task 3: Create all Markdown output contracts

**Files:**
- Create: `skills/dev-test-handoff/templates/as-built/00-index.md` through `16-design-coverage.md`.
- Create: `skills/dev-test-handoff/templates/test-handoff/00-TEST-WORKFLOW.md` through `18-runtime-observability.md`.

**Interfaces:**
- Consumes: the reference rules from Task 2.
- Produces: stable, independently readable Markdown contracts used by Stage A and Stage B.

- [ ] **Step 1: Add the As-Built index and architecture contracts.**

  Include `00-index.md`, `01-system-overview.md`, `02-frontend-design.md`, and `03-backend-design.md`, with required evidence/confidence and source-reference fields.

- [ ] **Step 2: Add the As-Built inventory and behavior contracts.**

  Include module, route, API, frontend-backend mapping, rules, flows, auth/permission, validation, state, data/external dependencies, error behavior, known unknowns, and design coverage templates. Every non-applicable section must use `NOT_APPLICABLE` rather than an empty field.

- [ ] **Step 3: Add the Handoff workflow and core coverage contracts.**

  Include the test-agent identity, reading order, workflow, status vocabulary, runtime mismatch behavior, scope, module/route inventory, rules, flows, validations, auth/permission, and state templates.

- [ ] **Step 4: Add the Handoff execution-boundary contracts.**

  Include API contracts, test data, testability/locator map, error behavior, risk priority, manual boundaries, known issues/limitations, coverage contract, traceability matrix, and runtime observability.

- [ ] **Step 5: Make the templates projection-safe.**

  Keep As-Built source references available, make Handoff fields externally observable, retain all stable IDs and confidence values, and include explicit placeholders `UNKNOWN`, `NOT_APPLICABLE`, and `DESIGN_RUNTIME_MISMATCH` where the evidence state requires them.

## Task 4: Write the workflow Skill and generated metadata

**Files:**
- Modify: `skills/dev-test-handoff/SKILL.md`
- Modify: `skills/dev-test-handoff/agents/openai.yaml` through the official generator if needed.

**Interfaces:**
- Consumes: Tasks 2–3 resources.
- Produces: a concise triggerable workflow that routes the future agent to the correct references and templates.

- [ ] **Step 1: Write frontmatter that triggers only on the relevant task.**

  Use lowercase hyphenated `name: dev-test-handoff`. Start the third-person description with `Use when...` and include source analysis, As-Built, design baseline, black-box handoff, frontend/backend, Markdown, and no-source-access tester triggers without summarizing the workflow in the description.

- [ ] **Step 2: Write the workflow body.**

  Define purpose, required/optional inputs, read-only boundary, stop conditions, six source passes, Stage A output, Design Gate, strict Stage B dependency, sanitization, Handoff Gate, and final self-check. Link each detailed rule to one direct reference path.

- [ ] **Step 3: Include one abstract invocation example.**

  Use placeholders such as `<frontend path>`, `<backend path>`, and `<output path>` only; do not use current product paths, credentials, or customer data. Explicitly say not to execute tests.

- [ ] **Step 4: Remove initializer placeholders and validate the metadata.**

  Ensure no `TODO`, `TBD`, or scaffold text remains, and regenerate `agents/openai.yaml` using the official generator when the final `SKILL.md` wording changes the display metadata.

## Task 5: Implement contract helper scripts

**Files:**
- Create: `skills/dev-test-handoff/scripts/validate_contract.py`
- Create: `skills/dev-test-handoff/scripts/self_test.py`

**Interfaces:**
- `validate_contract.py`: `python validate_contract.py <output_root>`; read-only, exits `0` on valid contracts and nonzero with concise failures otherwise.
- `self_test.py`: `python self_test.py`; creates and removes a temporary fixture, exits `0` only when the Skill resources and generated contract markers are coherent.

- [ ] **Step 1: Write the failing self-test invocation before implementing helpers.**

  Run:

  ```powershell
  python E:\automated-testing\skills\dev-test-handoff\scripts\self_test.py
  ```

  Expected during RED: failure because the script does not yet exist or the required resource contracts are incomplete.

- [ ] **Step 2: Implement read-only contract validation.**

  Use only Python standard library. Validate required directories/files, gate markers, allowed confidence/status values, required stable ID names, Stage B baseline references, and forbidden secret/path samples. Never modify the supplied output root.

- [ ] **Step 3: Implement the minimal self-test fixture.**

  Resolve the Skill root from `__file__`, create a temporary minimal output root, render only the smallest marker set needed to exercise both validators, run the validator as an in-process function, and clean up in a `finally` block.

- [ ] **Step 4: Run the self-test and targeted script checks.**

  Run:

  ```powershell
  python E:\automated-testing\skills\dev-test-handoff\scripts\self_test.py
  python E:\automated-testing\skills\dev-test-handoff\scripts\validate_contract.py --help
  ```

  Expected: `SELF_TEST=PASS` and a usable help/usage response; no product path or real artifact is touched.

## Task 6: Validate the completed Skill and run the GREEN pressure scenario

**Files:**
- Read-only validation of `skills/dev-test-handoff/`.
- Create only ignored temporary fixture output under the system temporary directory.

**Interfaces:**
- Consumes: complete Skill resources and the three RED scenarios.
- Produces: validation evidence and a clean, reviewable Git diff.

- [ ] **Step 1: Run the official Skill validation.**

  Run:

  ```powershell
  python C:\Users\Administrator\.codex\skills\.system\skill-creator\scripts\quick_validate.py E:\automated-testing\skills\dev-test-handoff
  ```

  Expected: validation passes for frontmatter and naming.

- [ ] **Step 2: Run static resource checks.**

  Verify all `SKILL.md` relative links resolve, every required output filename exists, no current product path/credential/token/cookie occurs, `SKILL.md` is below 500 lines, and all text files decode as UTF-8.

- [ ] **Step 3: Run the same three scenarios with the Skill loaded.**

  The expected GREEN behavior is: refuse to treat an unvalidated design as an approved handoff, keep ambiguous meaning `UNKNOWN`, redact credentials, support partial/multi-project scope explicitly, and refuse formal TestCase generation or test execution. Record the agent response and compare it to the RED observations.

- [ ] **Step 4: Run repository safety checks.**

  Run:

  ```powershell
  git diff --check
  git status --short
  git diff --stat
  git diff --name-only --cached
  ```

  Expected: only the approved design commit and the new Skill files are in scope; existing user changes remain untouched and no node_modules/browser binaries/generated product artifacts are added.

- [ ] **Step 5: Commit the Skill only.**

  Stage only `skills/dev-test-handoff/` and commit:

  ```powershell
  git add -- skills/dev-test-handoff
  git commit -m "feat: add development test handoff skill"
  ```

- [ ] **Step 6: Verify final synchronization without pushing unless separately authorized.**

  Run:

  ```powershell
  git status -sb
  git rev-list --left-right --count origin/main...HEAD
  ```

  Report the exact commit hash and whether push was performed. The current user request authorizes creation and commit, but does not independently authorize pushing `main`; do not push without a fresh explicit push instruction.

## Final review checklist

- [ ] Skill name is `dev-test-handoff` and folder name uses only lowercase letters, digits, and hyphens.
- [ ] `SKILL.md` is concise, workflow-oriented, UTF-8, and references every detailed resource.
- [ ] `agents/openai.yaml` is present and generated from the final metadata.
- [ ] All 17 As-Built and all 19 Handoff templates exist.
- [ ] Stage B cannot start from source independently; it consumes validated As-Built.
- [ ] Design and Handoff Gates have explicit failure markers.
- [ ] All seven stable ID families and confidence vocabulary are preserved.
- [ ] Sanitization and destructive-operation contracts are explicit.
- [ ] No formal TestCase, test execution, Word output, product modification, current product path, or secret is present.
- [ ] Official validator, self-test, UTF-8 scan, and `git diff --check` pass.
