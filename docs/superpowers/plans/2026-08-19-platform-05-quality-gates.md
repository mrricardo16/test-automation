# PLATFORM-05 TypeScript Quality Gates and Unified Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a strict, platform-owned TypeScript quality gate, a minimal ESLint gate, and safe unified local commands for PLATFORM-01 through PLATFORM-04.

**Architecture:** `tsconfig.platform.json` compiles only platform-owned TypeScript and an expected-error type fixture. `eslint.config.mjs` lints the same platform scope with a deliberately small rule set. Node wrappers execute Python Skill validators and synthetic Playwright suites through repo-relative commands, preserving the existing `npm test` meaning and never starting real-project tests.

**Tech Stack:** TypeScript, ESLint flat config, `typescript-eslint`, Playwright Test, Node.js child processes, existing Python Skill self-tests.

## Global Constraints

- Implement PLATFORM-05 only; do not create `.github/workflows`, `test:ci`, Environment Profiles, Aggregators, Flaky Policy, or Governance.
- Do not modify the three existing Skill contracts or migrate `.mjs` Synthetic Runtime files.
- TypeScript scope includes only platform-owned code: `scripts/platform`, `tests/acceptance`, `tests/api/synthetic`, selected Synthetic Web/platform tests, and `tests/types`.
- Lint excludes legacy Avalonia, real-project tests, `scratch`, `artifacts`, reports, generated output, and `node_modules`.
- Unified commands must be repo-owned, synthetic-only, and free of real localhost, real credentials, `config/local-projects.json`, DLL, database, Avalonia, Appium, and FlaUI access.
- Preserve existing user changes, untracked files, and `skills/dev-test-handoff/scripts/__pycache__/`; stage only an explicit PLATFORM-05 allowlist.
- Quality gate failures are command failures, not business `ExecutionStatus` failures.
- Preserve `SYN-BUG-001` as product `ExecutionStatus=FAIL` with acceptance `GateStatus=PASS`.

---

### Task 1: Type-level RED/GREEN contract

**Files:**
- Create: `tests/types/negative-contracts.ts`
- Create: `scripts/platform/verify-negative-types.mjs`

- [ ] Add `@ts-expect-error` assertions for invalid `ExecutionStatus`, `ExpectedBasis`, and `GateStatus` values using `scripts/platform/contract-types.ts`.
- [ ] Write the verifier to remove only the expectation comments into a temporary file, invoke the local TypeScript compiler, require a non-zero result, and remove only its own temporary directory.
- [ ] Run the verifier before adding TypeScript and confirm it reports the compiler is unavailable or the intended RED state rather than silently passing.

### Task 2: Minimal tooling and strict platform scope

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tsconfig.platform.json`
- Create: `eslint.config.mjs`

- [ ] Add only required devDependencies: `typescript`, `@types/node`, `eslint`, and `typescript-eslint`; do not add a runtime dependency or a new test framework.
- [ ] Configure `noEmit`, `strict`, ES2022/CommonJS-compatible resolution, Node and Playwright types, and only the platform-owned TypeScript include list.
- [ ] Configure flat ESLint for the same platform TypeScript scope with recommended TypeScript rules plus focused unused-variable and async-safety rules; allow existing explicit `any` in API response adapters where the response is deliberately runtime-shaped.
- [ ] Ensure no `.mjs` migration is required and no legacy Avalonia or real-project path enters either gate.

### Task 3: Formal quality commands

**Files:**
- Create: `scripts/platform/run-skill-tests.mjs`
- Create: `scripts/platform/run-platform-validation.mjs`
- Create: `scripts/platform/run-platform-tests.mjs`
- Create: `scripts/platform/run-platform-quality.mjs`
- Modify: `package.json`

- [ ] Add `npm run typecheck` as `tsc --noEmit -p tsconfig.platform.json`.
- [ ] Add `npm run lint` scoped to platform TypeScript paths.
- [ ] Add `test:web`, `test:api`, `test:skills`, `test:contracts`, `test:synthetic`, `validate`, and `test:platform`.
- [ ] Keep `npm test` unchanged and do not add `test:ci`.
- [ ] Make wrappers use repo-relative paths, propagate the first non-zero exit code, support `python` then `python3`, and keep validators readable on Windows and Linux.
- [ ] Make `test:platform` run typecheck, lint, contracts, skills, and synthetic in order; no real-project command is reachable from it.

### Task 4: Ignore only new quality artifacts

**Files:**
- Modify: `.gitignore`

- [ ] Add only `__pycache__/`, `*.pyc`, `coverage/`, and `.eslintcache` if the new commands produce them; do not remove or clean existing files.

### Task 5: GREEN validation and regression

**Files:**
- Modify: `projects/test-workflow/reports/platform-quality-gates.md`

- [ ] Run the negative type verifier, `npm run typecheck`, `npm run lint`, all unified commands, and the three Skill self-test/validator groups.
- [ ] Run PLATFORM-01 8/8, PLATFORM-02 10/10, PLATFORM-03 12/12, and PLATFORM-04 API tests.
- [ ] Run UTF-8 and executable safety scans; confirm no `test:ci`, GitHub Actions, real-project runtime, or Skill modifications were introduced.
- [ ] Record exact versions, scopes, commands, results, Known Bug semantics, and PLATFORM-06 prerequisites without claiming Agent Acceptance PASS.

### Task 6: Explicit commit and post-commit verification

- [ ] Stage only PLATFORM-05 files with an explicit allowlist and run `git diff --cached --check`.
- [ ] Commit `feat: add platform quality gates`; do not push.
- [ ] Re-run `npm run test:platform`, `git diff --check HEAD^ HEAD`, `git status`, `git log -5 --oneline`, and `git rev-list --left-right --count origin/main...HEAD`.

## Plan Self-Review

- Spec coverage: Tasks 1–2 cover strict TypeScript, negative types, ESLint, dependency policy, `.mjs` boundary, and scope. Task 3 covers every requested safe command and preserves `npm test`. Task 4 covers only command-generated ignores. Tasks 5–6 cover the complete matrix, Git safety, report, and expected `0 5` divergence.
- Placeholder scan: No command depends on an unspecified launcher, real-project profile, CI file, or future aggregator.
- Type consistency: The negative fixture imports canonical union types; `tsconfig.platform.json` includes it with `@ts-expect-error`; the standalone verifier removes only those comments and invokes the same local compiler.
