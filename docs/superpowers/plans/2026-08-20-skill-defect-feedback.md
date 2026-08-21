# Skill Defect Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为执行型 Skill 增加“缺陷索引 + 单缺陷详细反馈”双层产物，并明确开发交接 Skill 不负责生成产品缺陷。

**Architecture:** `defect-list.md` 保留为本轮缺陷索引；新增 `defect-feedback.md` 作为单个缺陷详细反馈模板，由 `DefectId`、`TestCaseId`、Handoff/Source Evidence、Expected/Actual、复现步骤、分类、证据和回归状态组成。`test-execution` 与 `whitebox-test-execution` 各自声明并校验该产物；`dev-test-handoff` 只声明下游反馈边界，不生成缺陷。

**Tech Stack:** Markdown Skill contracts, Python static validators/self-tests, existing Node platform validation.

## Global Constraints

- 所有 Markdown、Python、JSON 和文本文件保持 UTF-8。
- 保留用户现有未提交修改和未跟踪文件；不执行 `git clean`、reset、checkout discard、rebase 或 push。
- 正式验证遵守 TestCase-first；使用稳定 `TC-SKILL-FEEDBACK-001` 记录本功能。
- 产品源、真实 Runtime、真实凭据、真实 DLL、数据库和业务 localhost 均不访问。
- `ExecutionStatus` 只使用 `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, `SKIPPED`；产品 FAIL 不得被反馈层改写成 PASS。

---

### Task 1: Add the TestCase-first feedback contract check

**Files:**
- Create: `test-cases/platform/TC-SKILL-FEEDBACK-001.md`
- Modify: `skills/test-execution/scripts/validate_contract.py`
- Modify: `skills/whitebox-test-execution/scripts/validate_contract.py`

- [ ] Create the TestCase record before changing validators. It must identify the index/detail relationship and require `DefectId`, `TestCaseId`, Expected, Actual, reproduction, evidence, classification, owner/action, and retest state.
- [ ] Add required markers for `defect-feedback.md`, `DefectId`, `ExecutionStatus`, `Evidence`, `Reproduction`, and the rule that product FAIL remains FAIL.
- [ ] Run both validators and confirm RED because the detail template is not yet present.

### Task 2: Add detailed defect feedback templates

**Files:**
- Create: `skills/test-execution/templates/defect-feedback.md`
- Create: `skills/whitebox-test-execution/templates/defect-feedback.md`

- [ ] Use one detailed record per defect, with stable IDs and separate fields for Expected, Actual, ExecutionStatus, CoverageStatus, evidence, classification, owner/action, and retest.
- [ ] Keep `ERROR`, `BLOCKED`, `MANUAL`, and `DESIGN_RUNTIME_MISMATCH` out of product-defect classification unless evidence supports a real product contradiction.
- [ ] Include a clear prohibition against converting product `FAIL` to `PASS`.

### Task 3: Align the three Skill boundaries and validators

**Files:**
- Modify: `skills/test-execution/SKILL.md`
- Modify: `skills/test-execution/references/feedback-contract.md`
- Modify: `skills/test-execution/templates/defect-list.md`
- Modify: `skills/whitebox-test-execution/SKILL.md`
- Modify: `skills/whitebox-test-execution/templates/defect-list.md`
- Modify: `skills/dev-test-handoff/SKILL.md`

- [ ] State that execution Skills emit both the index and detailed feedback file.
- [ ] State that `dev-test-handoff` stops before TestCase/execution and therefore does not generate product defect feedback; it only carries sanitized baseline/mismatch context for downstream testing.
- [ ] Add the new template to each execution Skill’s validator/template inventory and self-test required resources.

### Task 4: Verify and review

**Commands:**

```powershell
python skills/test-execution/scripts/validate_contract.py
python skills/whitebox-test-execution/scripts/validate_contract.py
npm run test:skills
npm run validate
git diff --check
```

- [ ] Confirm the validators and Skill self-tests pass.
- [ ] Confirm no real product or runtime path was accessed and no user file was staged.
- [ ] Stop without commit or push unless separately authorized.
