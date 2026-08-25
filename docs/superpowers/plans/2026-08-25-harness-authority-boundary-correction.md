# Formal Web Harness Boundary Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce `PROJECT_PLAYWRIGHT` as the only formal Web/Project Preparation/Regression/Evidence harness and verify the boundary with six synthetic governance cases.

**Architecture:** A single JavaScript authority contract in `scripts/platform/harness-authority.mjs` is imported by the Playwright Synthetic validator and the rsscomposer project validator; `harness-authority.d.mts` supplies TypeScript types. Runtime ownership is implemented by `tests/web/helpers/runtime-session.ts` and `runtime-login.ts`. Skill/project documents state the same contract and project metadata records the current authority values.

**Tech Stack:** Node.js ESM, TypeScript, Playwright Test, Python contract self-test, Markdown, JSON.

## Global Constraints

- Do not execute real business TestCases or access the real product Runtime.
- Do not read or modify product source.
- Preserve all existing unrelated uncommitted changes.
- Do not use `git reset`, `git clean`, destructive checkout, `git add .`, or `git add -A`.
- Formal Web, Project Preparation, Regression, and formal Evidence use `PROJECT_PLAYWRIGHT` only.
- Agent Browser / `browser-client.mjs` are `EXPLORATION`, `DIAGNOSTIC`, and `ENVIRONMENT_OBSERVATION` only.
- Missing Runtime URL, credentials, or Playwright availability is `BLOCKED`/`ERROR`; no harness fallback.
- Keep all changed text/JSON/TypeScript files UTF-8.

### Task 1: Add failing synthetic authority contract tests

**Files:**
- Create: `test-cases/synthetic/TC-SYN-HARNESS-A-001.md` through `TC-SYN-HARNESS-F-001.md`
- Modify: `tests/web/platform-contract-validator.spec.ts`

- [ ] Add six TestCase records before executable tests, each with one unique TestCaseId and the formal/diagnostic expectation.
- [ ] Add Playwright tests A–F that call the not-yet-existing `classifyHarnessAuthority` and assert the six decisions and authority codes.
- [ ] Run the focused spec and verify the tests fail because the authority module is missing.

### Task 2: Implement the canonical Harness Authority Contract and Validator

**Files:**
- Create: `scripts/platform/harness-authority.mjs`
- Create: `scripts/platform/harness-authority.d.mts`
- Modify: `tests/web/platform-contract-validator.spec.ts`
- Modify: `projects/rsscomposer-blackbox/scripts/validate-project.mjs`
- Modify: `projects/rsscomposer-blackbox/project.json`

- [ ] Define controlled `HarnessType`, phase, decision, and eligibility values.
- [ ] Implement `validateHarnessAuthority` for formal Web, Project Preparation, Regression, Evidence, diagnostic-only use, missing prerequisites, and forbidden fallback.
- [ ] Implement `validateProjectHarnessPolicy` for the project-level authority fields.
- [ ] Wire the project validator to reject policy drift.
- [ ] Run the focused Synthetic spec and project validator; all A–F checks must pass.

### Task 3: Add explicit RuntimePage ownership and login helpers

**Files:**
- Create: `tests/web/helpers/runtime-session.ts`
- Create: `tests/web/helpers/runtime-login.ts`
- Create: `skills/test-execution/references/web-runtime-execution.md`
- Modify: `tests/web/real-project/TC-WEB-LOGIN-001.spec.ts`
- Modify: `tests/web/real-project/TC-SM-USER-FLOW-001.spec.ts`
- Modify: `tests/web/real-project/TC-SM-SYSTEM-MANAGEMENT-001.spec.ts`

- [ ] Implement explicit session ownership, usable-page checks, and fail-fast `RuntimePageInvariantFailed` checks.
- [ ] Implement login/navigation with `domcontentloaded` plus URL/business conditions, never `networkidle` as default success.
- [ ] Reuse the helper in existing real-project specs without executing them.
- [ ] Typecheck only the helper-compatible platform surface; do not launch the real project.

### Task 4: Update Skill, references, and current project workflow documents

**Files:**
- Modify: `skills/test-execution/SKILL.md`
- Modify: `skills/test-execution/references/execution-rules.md`
- Modify: `skills/test-execution/references/evidence-rules.md`
- Modify: `skills/test-execution/scripts/validate_contract.py`
- Modify: `skills/test-execution/scripts/self_test.py`
- Create: `projects/rsscomposer-blackbox/docs/15-web-execution-workflow.md`
- Create: `projects/rsscomposer-blackbox/docs/16-harness-authority-policy.md`
- Modify: `projects/rsscomposer-blackbox/docs/07-execution-policy.md`
- Modify: `projects/rsscomposer-blackbox/docs/06-test-data-policy.md`
- Modify: `projects/rsscomposer-blackbox/docs/08-evidence-policy.md`
- Modify: `projects/rsscomposer-blackbox/docs/11-environment-policy.md`
- Modify: `projects/rsscomposer-blackbox/docs/13-current-status.md`
- Modify: `projects/rsscomposer-blackbox/scripts/validate-project.mjs`

- [ ] State formal harness, preparation harness, regression harness, formal evidence source, fallback, RuntimePage, popup, and diagnostic authority rules.
- [ ] State missing URL/credential behavior and prohibit browser-plugin state reuse.
- [ ] Make the Skill validator and self-test require the new authority rules and reference.
- [ ] Make current rsscomposer documents and project metadata consistent.

### Task 5: Run focused validation and final boundary audit

**Files:**
- Modify only if validation exposes a defect in the files above.

- [ ] Run `npx playwright test tests/web/platform-contract-validator.spec.ts --reporter=line`.
- [ ] Run `python skills/test-execution/scripts/validate_contract.py`.
- [ ] Run `python skills/test-execution/scripts/self_test.py`.
- [ ] Run `node projects/rsscomposer-blackbox/scripts/validate-project.mjs`.
- [ ] Run `git diff --check` and inspect status/diff without staging unrelated work.
- [ ] Confirm no real business TestCase, product source read, or product modification occurred.

