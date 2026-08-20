# Project Artifact Organization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove temporary test-run products, place the current durable outputs under the project `test-workflow`, and define a repository rule for future project-scoped test outputs.

**Architecture:** Keep test source, TestCases, contracts, skills, and design documents in their existing technical directories. Use `projects/<project-slug>/` as the project-owned boundary for reports, durable outputs, and ignored runtime evidence; the current project slug is `test-workflow` and its display name is “测试工作流是否正常运行”.

**Tech Stack:** PowerShell, Git, Markdown, Playwright, Node.js, Python, .NET/Avalonia.

## Global Constraints

- Preserve existing uncommitted user changes and UTF-8 encoding.
- Do not modify the real product source or runtime directories.
- Delete only explicitly identified temporary test/build products.
- Keep TestCaseId mappings and existing test source paths unchanged.
- Future test outputs must be created below `projects/<project-slug>/`.

---

### Task 1: Remove temporary products

**Files:**
- Delete: `artifacts/`
- Delete: `test-results/`
- Delete: `scratch/`
- Delete: `reports/playwright-report/`
- Delete: `tests/**/bin/` and `tests/**/obj/`
- Delete: `outputs/process/_probe.vsdx`

- [ ] **Step 1: Verify all deletion targets resolve inside the repository.**
- [ ] **Step 2: Delete only the verified temporary directories and probe file.**
- [ ] **Step 3: Confirm the temporary roots are absent and no source/TestCase directory was targeted.**

### Task 2: Create the current project artifact boundary

**Files:**
- Create: `projects/README.md`
- Create: `projects/test-workflow/README.md`
- Move: current untracked durable reports under `reports/` to `projects/test-workflow/reports/`
- Move: current `outputs/` contents to `projects/test-workflow/outputs/`

- [ ] **Step 1: Create the project manifest and directory guide.**
- [ ] **Step 2: Move current outputs and untracked generated reports without overwriting existing files.**
- [ ] **Step 3: Verify the moved files are present and the source output root is empty.**

### Task 3: Encode the future output rule

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `.gitignore`
- Modify: active Playwright/API/Avalonia/documentation output paths where they currently write outside `projects/test-workflow/`

- [ ] **Step 1: Add the project-scoped artifact contract and naming rules.**
- [ ] **Step 2: Point current runtime evidence/report generators at `projects/test-workflow/`.**
- [ ] **Step 3: Add ignored patterns for project-local runtime evidence and test results.**

### Task 4: Verify the reorganization

**Files:**
- Inspect: Git status, UTF-8 text files, path references, and project output inventory.

- [ ] **Step 1: Run `git diff --check`.**
- [ ] **Step 2: Run focused repository checks for project output path references and forbidden temporary roots.**
- [ ] **Step 3: Run the repository validation command that does not require real product changes.**
