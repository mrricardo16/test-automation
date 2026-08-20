# PLATFORM-08 Governance and Final Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Canonical Contracts the documented semantic source for the three existing Skills, add a deterministic drift gate, refresh governance entry points, and publish a layered final acceptance report without expanding runtime or agent capabilities.

**Architecture:** `scripts/platform/governance-check.mjs` performs a small structural check over the three Skill entrypoints and governance README files; it recognizes Legacy compatibility sections separately from active canonical declarations. Documentation changes preserve historical reports, TestCase IDs, and old formats while linking new work to `contracts/` and the PLATFORM-01–07 platform layer.

**Tech Stack:** Markdown, Node.js built-in test runner, existing Python Skill self-tests/validators, existing platform commands.

## Global Constraints

- Implement PLATFORM-08 only; do not add PLATFORM-09, a fourth Skill, a new test framework, Agent Invocation, Windows self-hosted CI, Real Project CI, or a remote push.
- Keep the three Skills independent: DEV-TEST-HANDOFF stops at sanitized Handoff; TEST-EXECUTION is Handoff-driven black-box execution; WHITEBOX-TEST-EXECUTION is source-driven and product-source read-only.
- Canonical vocabulary comes from `contracts/`; LegacyFieldAdapter remains the compatibility boundary and old TestCases/reports/evidence/IDs are not rewritten.
- Keep `ExecutionStatus` exactly `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, `SKIPPED`; `NOT_APPLICABLE` remains Applicability/Coverage semantics only.
- Preserve `ExpectedBasis`, `BaselineStatus`, `SourceRuntimeAlignment`, non-invasive Code Coverage, `ApplicabilityStatus`, `GateStatus`, and Evidence semantics from PLATFORM-01/07.
- Preserve `GITHUB_HOSTED_RUN=NOT_EXECUTED` and `AGENT_ACCEPTANCE=BLOCKED / MissingAgentInvocationCapability`.
- Preserve all user modifications and untracked files; stage only an explicit PLATFORM-08 allowlist; do not use reset/clean/checkout discard/add-all/force push.

---

### Task 1: Governance RED contract

**Files:**
- Create: `test-cases/platform/TC-PLATFORM-08-GOV-001.md`
- Create: `tests/platform/governance-check.spec.mjs`

- [ ] Record the governance TestCase before the check implementation.
- [ ] Add one unsafe fixture that declares `RUNTIME_OBSERVED` as ExpectedBasis and `NOT_APPLICABLE` as an ExecutionStatus, and one safe fixture with canonical links, three Skill boundaries, and Legacy compatibility notes.
- [ ] Run the focused Node test before `scripts/platform/governance-check.mjs` exists and confirm the expected module-not-found RED result.

### Task 2: Contract Drift Check and Skill alignment

**Files:**
- Create: `scripts/platform/governance-check.mjs`
- Modify: `skills/dev-test-handoff/SKILL.md`
- Modify: `skills/test-execution/SKILL.md`
- Modify: `skills/whitebox-test-execution/SKILL.md`
- Modify: `skills/test-execution/scripts/self_test.py`, `skills/test-execution/scripts/validate_contract.py`
- Modify: `skills/whitebox-test-execution/scripts/self_test.py`, `skills/whitebox-test-execution/scripts/validate_contract.py`
- Modify: active Skill references/templates that state obsolete canonical statuses

- [ ] Require canonical contract references, boundaries, six execution statuses, and explicit Legacy adapter language.
- [ ] Replace active Skill declarations that include `NOT_APPLICABLE` as ExecutionStatus or old reconciliation values; retain old values only under explicit legacy mapping notes.
- [ ] Align White-box ExpectedBasis with `REQUIREMENT`, `DESIGN`, `APPROVED_BASELINE`, `HANDOFF_BASELINE`, `CODE_BEHAVIOR`, `UNKNOWN`, while keeping SourceEvidence, BaselineStatus, SourceRuntimeAlignment, and non-invasive Code Coverage mandatory.
- [ ] Keep all three self-tests and validators green; do not delete old assertions without adding the canonical compatibility assertion.

### Task 3: Governance documentation

**Files:**
- Modify: `README.md`
- Modify: `test-cases/README.md`
- Modify: `config/README.md`
- Create: `reports/README.md`

- [ ] Put Platform Overview, Architecture, Skill Modes, Safe Commands, CI Scope, Directory Guide, Capability Status, Known Limitations, and Historical Notes at the README entry point without deleting history.
- [ ] Document TestCase-first, canonical schema fields, stable IDs, LegacyFieldAdapter, and no historical rewrite.
- [ ] Document committed examples versus ignored local real values and generated artifacts versus committed audit reports.
- [ ] State GitHub-hosted CI is not executed, Agent Acceptance is blocked, Real Product Acceptance is out of scope, and Desktop Hosted CI is not implemented.

### Task 4: Deterministic final acceptance report

**Files:**
- Create: `reports/agent-driven-platform-acceptance.md`

- [ ] Record actual current platform commit, date, scope, Environment, PLATFORM-01–08 status/evidence/limitations, contract vocabulary, three Skill boundaries, Known Bug semantics, OverallResult/Flaky behavior, and Git/remote facts.
- [ ] Layer acceptance as Deterministic Platform, Local CI Gate, Remote GitHub CI, Agent Acceptance, Real Product, and Desktop Hosted CI.
- [ ] State no real Runtime/product/source/secret access and preserve the current Agent/Remote limitations.

### Task 5: Final verification, staging, and commit

- [ ] Run `npm run typecheck`, `npm run typecheck:negative`, `npm run lint`, contract/Skill/Web/API/Synthetic/profile/aggregation/validate/platform/ci-safety/test:ci commands, plus all three Skill self-tests and validators.
- [ ] Run `node scripts/platform/governance-check.mjs`, UTF-8/safety checks, and `git diff --check`.
- [ ] Stage only PLATFORM-08 files, commit `docs: align platform governance and contracts`, do not push, and report actual `origin/main...HEAD`.

## Plan Self-Review

- Spec coverage: Skill boundaries and canonical vocabulary are Task 2; Legacy/TestCase/Config/Reports/README governance is Task 3; final layered acceptance and all required limitations are Task 4; deterministic regression and Git safety are Task 5.
- Drift false positives: the checker scans active Skill entrypoints and explicit declaration patterns; it allows old values in a `Legacy`/`Adapter` compatibility section and does not rewrite historical reports.
- Scope: no runtime code, CI workflow logic, new Skill, agent invocation, real project, or remote state mutation is included.
