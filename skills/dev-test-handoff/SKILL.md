---
name: dev-test-handoff
description: Use when Codex must inspect readable frontend and/or backend source, reconstruct the current As-Built design, validate a design baseline, or prepare a sanitized Markdown handoff for a black-box test agent without source access.
---

# Dev Test Handoff

Build a traceable evidence baseline before projecting a source-inaccessible testing handoff. The invariant is:

```text
Source → As-Built → Design Validation Gate → Sanitized Test Handoff
```

## Use this Skill when

- a developer can provide frontend and/or backend source;
- the requested result is current implementation evidence, As-Built design, route/API/module mapping, or a black-box testing handoff;
- the future tester must work from Markdown without source access;
- the task spans Vue, React, Angular, ASP.NET Core, Java, mixed repositories, multiple apps, or multiple services.

Do not use it to execute tests, create formal TestCases, modify product code, build or run a product, connect to production data, generate Word manuals, or repair defects.

## Canonical Contracts and boundary

The repository-level contracts under `contracts/` are authoritative for vocabulary and traceability:

- [status contract](../../contracts/status-contract.md): `ExecutionStatus`, `ApplicabilityStatus`, `CoverageStatus`, `GateStatus`, and `BaselineStatus`;
- [TestCase contract](../../contracts/testcase-contract.md): `ExpectedBasis` is `REQUIREMENT`, `DESIGN`, `APPROVED_BASELINE`, `HANDOFF_BASELINE`, `CODE_BEHAVIOR`, or `UNKNOWN`;
- [coverage](../../contracts/coverage-contract.md), [evidence](../../contracts/evidence-contract.md), [confidence](../../contracts/confidence-contract.md), and [ID](../../contracts/id-contract.md) contracts.
- [handoff integrity](../../contracts/handoff-integrity-contract.md): version every hash envelope and use the shared Producer helper in `scripts/platform/handoff-integrity.mjs`; do not publish an independently implemented package hash.

Runtime observations belong to Actual/Observation Evidence and `ObservationEvidenceIds`; they are never an `ExpectedBasis`. `CODE_BEHAVIOR` is limited to characterization or implementation-regression claims and does not assert requirements compliance. Legacy fields are interpreted through `LegacyFieldAdapter` without rewriting historical records.

The active handoff vocabulary also records `SourceRuntimeAlignment`, `Confidence`, and `GateStatus` when applicable; `BaselineStatus` describes the design baseline gate.

This Skill owns source inspection, As-Built reconstruction, the Design Validation Gate, and sanitized Handoff projection only. It does not create formal TestCases or execute tests. It does not generate defect feedback or a defect list: downstream execution Skills own defect classification, evidence collection, defect feedback, and regression reporting after real execution.

## Inputs

Require `output_root` and at least one non-empty source scope:

```text
frontend_source=<path or list, optional>
backend_source=<path or list, optional>
output_root=<path, required>
```

Optional inputs: `existing_design_docs`, `existing_runtime_reports`, `existing_test_reports`, `scope`, `product_name`, `environment_notes`, and `exclude_paths`.

Treat source as read-only. Do not install dependencies, change configuration, run migrations, write databases, or build/run when source inspection is sufficient. Ask for explicit authorization before any action outside this boundary.

## Workflow

### 1. Establish scope

Confirm that at least one source side exists. Inventory every workspace, solution, project, package, application, service, and excluded path before reading implementation files. For frontend-only or backend-only input, label the missing side `NOT_PROVIDED`; do not infer a complete system.

Load [source-analysis-rules.md](references/source-analysis-rules.md) and [confidence-and-ids.md](references/confidence-and-ids.md) before assigning facts or IDs.

### 2. Run six read-only analysis passes

1. Structure inventory: projects, packages, entry points, configuration shape, and external boundaries.
2. Entry inventory: frontend routes/menus and backend controllers/handlers/endpoints.
3. Module inventory: modules, features, pages, services, DTOs, entities, and dependencies that actually exist.
4. Behavior inventory: rules, validation, permissions, states, flows, data constraints, error behavior, and observability.
5. Cross mapping: frontend page/API to HTTP endpoint/handler/service/data or external dependency.
6. Completeness audit: coverage, confidence, unknowns, security, and source references.

Read targeted files per pass. Do not load an entire large repository into context at once. Keep source references relative to the supplied source root and include symbol names or route/endpoint literals where available.

### 3. Generate Stage A

Render every file in [templates/as-built](templates/as-built/) under `<output_root>/as-built/`. Preserve the exact template filenames. Use `NOT_APPLICABLE` for an inapplicable category and `UNKNOWN` for insufficient evidence; never leave an important field blank.

Every substantive fact must carry exactly one of:

```text
CONFIRMED_FROM_CODE
CONFIRMED_FROM_RUNTIME
INFERRED
UNKNOWN
```

Use stable `MOD-`, `FEAT-`, `RULE-`, `FLOW-`, `API-`, `VALID-`, and `STATE-` identifiers. Read [design-validation-gate.md](references/design-validation-gate.md) and write `16-design-coverage.md` before any Handoff work.

### 4. Enforce the Design Gate

If the gate fails, write `DESIGN_BASELINE_INCOMPLETE` plus `Missing`, `Reason`, and `Impact`. A restricted Handoff may be produced only with `HANDOFF_LIMITED_BY_DESIGN_GAPS`. Do not silently fill gaps.

Do not start Stage B before `16-design-coverage.md` exists. A request for speed, a source-supported draft, or a “preliminary handoff” does not waive this order. If the gate fails, keep the incomplete baseline and make the restriction visible in the Handoff.

### 5. Project Stage B only from Stage A

Read the validated As-Built Markdown, not source as a second independent business interpretation. If a contradiction or missing reference requires source re-checking, update the affected As-Built document, rerun the Design Gate, and then regenerate the affected Handoff documents.

Load [security-sanitization.md](references/security-sanitization.md) and [handoff-validation-gate.md](references/handoff-validation-gate.md). Render every file in [templates/test-handoff](templates/test-handoff/) under `<output_root>/test-handoff/`.

Keep all stable IDs, confidence values, `UNKNOWN`, feature flags, environment gates, and runtime mismatch markers. Remove private classes/methods, source paths, repository internals, credentials, tokens, cookies, secrets, connection-string credentials, and personal local paths unless a safe external behavior requires a generalized statement.

### 6. Validate and stop

Run the Handoff Gate. Add `DESIGN_RUNTIME_MISMATCH` when supplied runtime evidence contradicts the design; do not rewrite expected design to match runtime. Recommend `WEB_UI`, `API`, `BOTH`, or `MANUAL` layers and locator semantics, but do not emit Playwright/API code or formal TestCases.

Use the bundled read-only helper when available:

```powershell
python <skill-root>/scripts/validate_contract.py <output_root>
```

Stop after Markdown Handoff and validation artifacts are complete. The downstream test workflow owns Coverage Matrix, TestCase design, execution, evidence, defect feedback, and regression reporting.

## Abstract invocation

```text
Use the dev-test-handoff Skill.

Frontend source: <frontend path or empty>
Backend source: <backend path or empty>
Output: <output path>

Generate the As-Built design, pass the Design Validation Gate, and derive the sanitized black-box test handoff. Do not execute tests, generate formal TestCases, modify product source, or generate Word documents.
```

## Final self-check

- Both stages exist, and Stage B cites the Stage A baseline.
- Every major project, route, externally testable API, module, mapping, rule, unknown, and gate result is represented.
- IDs and confidence never change during projection.
- `UNKNOWN`, `NOT_APPLICABLE`, destructive-operation safeguards, feature/environment gates, locator stability, and `DESIGN_RUNTIME_MISMATCH` are explicit.
- Handoff contains `00-TEST-WORKFLOW.md`, coverage/data contracts, and traceability, but no formal TestCase or test result.
- No secret, credential, current business path, customer data, product source, or generated runtime artifact is present.

## Red flags

| Temptation | Required response |
|---|---|
| “Generate the handoff first; validate later.” | Stop Stage B. Finish As-Built and `16-design-coverage.md` first. |
| “The status value is obvious.” | Record the literal branch and set business meaning to `UNKNOWN` unless evidence proves it. |
| “Both source sides are present, so coverage is complete.” | Keep project boundaries and mark unmapped or unverified integration `UNKNOWN`/`UNMATCHED`. |
| “The source is clear enough to create TestCases now.” | Do not create formal TestCases; leave TestCase ownership to the downstream test workflow. |
