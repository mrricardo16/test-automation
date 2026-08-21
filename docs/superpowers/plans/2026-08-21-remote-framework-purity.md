# Remote Framework Purity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep only reusable test-platform content in the remote repository while preserving all project-level test products locally.

**Architecture:** `projects/README.md` remains the tracked policy entry point. Every `projects/<project-slug>/` directory becomes local-only through `.gitignore`; tracked project directories are removed from the index with `git rm --cached`, which preserves their local files. Shared contracts, skills, scripts, framework tests, fixtures, and repository-level audit reports remain tracked.

**Tech Stack:** Git, PowerShell, Markdown, existing Node quality gates.

## Global Constraints

- Do not delete local project files; only remove project files from Git tracking.
- Do not rewrite Git history or force-push.
- Keep `projects/README.md` tracked as the local project-storage contract.
- Keep all Markdown and text files UTF-8.
- Do not add `artifacts/`, `test-results/`, `playwright-report/`, `node_modules/`, or `Typora_Hook_Log.txt` to Git.
- Do not modify product source or runtime directories.

---

### Task 1: Define the local-only project boundary

**Files:**
- Modify: `.gitignore`
- Modify: `projects/README.md`

**Interfaces:**
- Produces a tracked policy README and an ignore rule that keeps `projects/README.md` while ignoring every `projects/<project-slug>/` directory.

- [ ] **Step 1: Add the local-only ignore rule**

Add the following block to `.gitignore`:

```gitignore
# Project-level test products remain local-only; keep the policy README tracked.
projects/*/
!projects/README.md
```

- [ ] **Step 2: Rewrite the project policy README**

Update `projects/README.md` so it states that project-level reports, outputs, test cases, scripts, screenshots, traces, and runtime evidence are local-only, while reusable platform sources remain in the root `contracts/`, `skills/`, `scripts/`, `test-cases/`, and `tests/` directories.

- [ ] **Step 3: Verify the ignore boundary**

Run:

```powershell
git check-ignore -v -- projects/rss-dispatch/README.md projects/test-workflow/README.md
git check-ignore -v -- projects/README.md
```

Expected: the two project README paths are ignored; `projects/README.md` is not ignored.

### Task 2: Remove tracked project products without deleting local files

**Files:**
- Index only: `projects/rss-dispatch/`
- Index only: `projects/test-workflow/`

**Interfaces:**
- Consumes the local-only ignore boundary from Task 1.
- Produces a Git index containing `projects/README.md` but no project-specific directory.

- [ ] **Step 1: Confirm local project directories exist**

Run:

```powershell
Test-Path -LiteralPath projects/rss-dispatch
Test-Path -LiteralPath projects/test-workflow
```

Expected: both commands return `True`.

- [ ] **Step 2: Remove only tracked project files from the index**

Run:

```powershell
git rm --cached -r -- projects/rss-dispatch projects/test-workflow
```

Expected: Git reports removed index entries while the two directories remain on disk.

- [ ] **Step 3: Verify local preservation and index purity**

Run:

```powershell
Test-Path -LiteralPath projects/rss-dispatch
Test-Path -LiteralPath projects/test-workflow
git ls-files projects
```

Expected: both local directories return `True`; only `projects/README.md` is listed by Git.

### Task 3: Validate, commit, and publish the framework-only tree

**Files:**
- Git index and commit metadata only.

**Interfaces:**
- Produces a clean remote branch whose root has no project-specific tracked directory.

- [ ] **Step 1: Run structural and diff checks**

Run:

```powershell
git diff --cached --check
git diff --cached --name-only
```

Expected: no whitespace errors; the staged deletion set contains project files, while `projects/README.md` remains tracked.

- [ ] **Step 2: Run the repository quality gate**

Run:

```powershell
npm run test:ci
```

Expected: `CI_SAFETY=PASS`, `STATIC_PLATFORM_VALIDATION=PASS`, `SKILL_COMMANDS=PASS`, and `TEST_PLATFORM=PASS`.

- [ ] **Step 3: Commit the remote-boundary change**

Run:

```powershell
git add -- .gitignore projects/README.md
git commit -m "chore: keep project tests local-only"
```

- [ ] **Step 4: Push and verify remote synchronization**

Run:

```powershell
git push origin codex/test-report-governance
git fetch --prune origin
git status -sb
git rev-list --left-right --count origin/codex/test-report-governance...HEAD
git ls-tree --name-only origin/codex/test-report-governance
git ls-tree -r --name-only origin/codex/test-report-governance | Select-String '^projects/[^/]+/'
```

Expected: worktree is clean, divergence is `0 0`, root `projects` contains only the policy entry point, and the final command returns no project-specific tracked paths.
