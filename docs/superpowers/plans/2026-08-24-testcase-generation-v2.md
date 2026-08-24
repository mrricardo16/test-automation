# TestCase Generation Standard V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将主干 TestCase 生成升级为 Atomic + Composite + ScenarioSuite，并让 Schema、模板、Validator、自测和 Skill 引用可执行且保持历史兼容。

**Architecture:** 以 `contracts/` 作为 Canonical Contract，以 `contracts/schemas/` 作为机器校验边界；测试执行和 whitebox Skill 只引用共享生成规范，保留各自 Expected 来源边界。Synthetic fixtures 在测试仓库内验证生命周期和自动化分流，不连接真实产品。

**Tech Stack:** Markdown, JSON Schema, Python validation/self-test, Node.js platform validation, existing repository test harness.

## Global Constraints

- 只修改 `E:/automated-testing`，不修改真实产品源代码或运行时。
- 所有 Markdown、JSON、Python、TypeScript 和文本文件保持 UTF-8。
- 保留已有 dirty/untracked 工作区改动，不使用 reset、clean、checkout、`git add .` 或 `git add -A`。
- 历史 TestCase 不批量重写；新 TestCase 使用 V2 字段。
- AUTO 必须无人值守；MANUAL 不得被 AUTO Runner 等待或混入 AUTO_PARTIAL 中间人工步骤。
- 缺少 Expected 进入 ExpectationGap，不得从 Runtime Observation 猜测 Expected。

### Task 1: Canonical contracts and schemas

**Files:**
- Create: `contracts/testcase-generation-standard.md`
- Create: `contracts/composite-testcase-standard.md`
- Create: `contracts/schemas/scenario-suite.schema.json`
- Create: `contracts/schemas/expectation-gap.schema.json`
- Modify: `contracts/testcase-contract.md`
- Modify: `contracts/schemas/testcase.schema.json`

- [ ] Define ATOMIC/COMPOSITE fields, lifecycle, coverage models, CRUD cross-operation rules, and expectation-gap protection.
- [ ] Add backward-compatible V2 schema fields and constrained enums.
- [ ] Validate schema examples against existing parser conventions.

### Task 2: Templates and references

**Files:**
- Create: `skills/test-execution/templates/composite-testcase.md`
- Create: `skills/test-execution/templates/scenario-suite.md`
- Create: matching composite and scenario-suite templates under `skills/whitebox-test-execution/templates/`
- Modify: Web/API/Manual templates for both skills.
- Modify: `skills/test-execution/SKILL.md`, `skills/whitebox-test-execution/SKILL.md`, `test-cases/README.md`

- [ ] Add Objective, InitialState, ExpectedPerStep, PrimaryAssertion, PostConditions, StateTransitions, CleanupVerification, risk and automation fields.
- [ ] Reference the canonical generation standard without duplicating diverging rules.
- [ ] Document report granularity: independently executable/assertable/evidence-capable scenarios get independent TestCaseId.

### Task 3: Governance validator and fixtures

**Files:**
- Modify: existing TestCase validator and self-test scripts found by repository search.
- Create or modify: synthetic validation fixtures and focused tests under existing test-owned locations.

- [ ] Validate composite required fields, state fields, destructive cleanup, risk/automation eligibility, interactive automation, mega-case warning, duplicate detection, and expectation gaps.
- [ ] Add synthetic fixtures for Create→Read, Delete→Read, Delete→Recreate, Delete→Update, Delete→Delete, Disable→Update and parent-child integrity.
- [ ] Preserve existing validator behavior and legacy adapter compatibility.

### Task 4: Verification

**Files:**
- No product files; only test-owned reports or temporary ignored artifacts if needed.

- [ ] Run UTF-8, schema, static platform, validator, self-test and synthetic acceptance checks.
- [ ] Run focused platform regression, `git diff --check`, and inspect exact scoped diff.
- [ ] Confirm no real product access, no credentials, no unrelated staged files, and report commit/push status without pushing unless separately authorized.
