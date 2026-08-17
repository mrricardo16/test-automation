# Test Automation Workspace Initialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Initialize E:\automated-testing as a minimal Playwright Web automation workspace, document TestCase-first execution rules, and publish it to the private GitHub repository mrricardo16/test-automation on main.

**Architecture:** Use Node.js, TypeScript, and Playwright only in this phase. tests\web contains executable Web tests; test-cases contains the source TestCase records; reports contains committed audit reports and the HTML report location; artifacts contains ignored run evidence. API, Avalonia, and manual directories are reserved without implementing those systems.

**Tech Stack:** Windows PowerShell, existing Git 2.53.0, Node.js 24.15.0, npm 11.12.1, .NET SDK 10.0.302, GitHub CLI 2.93.0, @playwright/test, Chromium.

## Global Constraints

- Reuse existing Git, Node.js/npm, .NET SDK, and GitHub CLI; do not upgrade or reinstall them.
- Install only project-local @playwright/test and the required Chromium browser.
- Do not install Avalonia Appium, API frameworks, CI/CD tooling, or playwright install-deps.
- Preserve UTF-8 encoding for all Markdown, TypeScript, JSON, and text files.
- Do not modify product code or system configuration.
- Do not commit secrets, .env files, tokens, passwords, node_modules, browser binaries, or generated run artifacts.
- Every formal automated test has a unique TestCaseId mapped to its implementation.
- Verify success claims with executed commands and preserve failure evidence.
- Create or connect only to the private mrricardo16/test-automation repository; never force-push or overwrite an existing remote.

---

### Task 1: Record the pre-install environment and create the skeleton

Files:
- Create: E:\automated-testing\reports\environment-check.md
- Create directories: docs\requirements, docs\designs, docs\flows, test-cases, tests\api, tests\web, tests\avalonia, tests\manual, config, scripts, reports, artifacts

Interfaces:
- Produces the pre-install evidence used by later installation and initialization reports.

- [ ] Step 1: Create only the requested directories.

    $dirs = @(
      'E:\automated-testing\docs\requirements',
      'E:\automated-testing\docs\designs',
      'E:\automated-testing\docs\flows',
      'E:\automated-testing\test-cases',
      'E:\automated-testing\tests\api',
      'E:\automated-testing\tests\web',
      'E:\automated-testing\tests\avalonia',
      'E:\automated-testing\tests\manual',
      'E:\automated-testing\config',
      'E:\automated-testing\scripts',
      'E:\automated-testing\reports',
      'E:\automated-testing\artifacts'
    )
    $dirs | ForEach-Object { New-Item -ItemType Directory -Path $_ -Force | Out-Null }

    Expected: every path exists under E:\automated-testing and no path outside it is touched.

- [ ] Step 2: Write reports\environment-check.md with the actual scan values.

    It must record Git 2.53.0, Node.js 24.15.0, npm 11.12.1, .NET SDK 10.0.302, GitHub CLI 2.93.0, authenticated account mrricardo16, missing target-project Playwright, and missing Playwright browser cache. It must explicitly state: "Node.js: Detected existing installation; Reused; No installation performed." It must state that the target directory and test-automation repository were absent during the initial checks.

- [ ] Step 3: Validate the report before installation.

    $p = 'E:\automated-testing\reports\environment-check.md'
    $utf8 = [Text.UTF8Encoding]::new($false, $true)
    [void]$utf8.GetString([IO.File]::ReadAllBytes($p))
    Test-Path -LiteralPath $p

    Expected: UTF-8 decoding succeeds and the final command prints True.

- [ ] Step 4: Commit the evidence.

    git add reports/environment-check.md
    git diff --cached --check
    git commit -m "docs: record pre-install environment check"

### Task 2: Initialize Node and install only Playwright

Files:
- Create: package.json
- Create: package-lock.json
- Modify: package.json to add the test script

Interfaces:
- Produces a reproducible lockfile and the npm test entrypoint.

- [ ] Step 1: Initialize only when package.json is absent.

    if (-not (Test-Path -LiteralPath 'E:\automated-testing\package.json')) { npm init -y }

- [ ] Step 2: Check and install the project-local package.

    npm list @playwright/test
    if ($LASTEXITCODE -ne 0) { npm install -D @playwright/test }

    Expected: @playwright/test is in devDependencies and package-lock.json exists. Do not install a global package.

- [ ] Step 3: Add this script to package.json while preserving dependency metadata.

    "scripts": {
      "test": "playwright test"
    }

- [ ] Step 4: Verify the CLI and install only Chromium.

    npx playwright --version
    npx playwright install chromium

    Expected: the CLI prints its version and Chromium installation completes. Do not run playwright install-deps.

- [ ] Step 5: Verify package identity and UTF-8.

    npm list @playwright/test
    $utf8 = [Text.UTF8Encoding]::new($false, $true)
    foreach ($file in @('package.json', 'package-lock.json')) {
      [void]$utf8.GetString([IO.File]::ReadAllBytes((Join-Path 'E:\automated-testing' $file)))
    }

- [ ] Step 6: Commit.

    git add package.json package-lock.json
    git diff --cached --check
    git commit -m "chore: add Playwright test dependency"

### Task 3: Add the TestCase contract and deferred Avalonia boundary

Files:
- Create: test-cases\README.md
- Create: test-cases\TC-WEB-ENV-001.md
- Create: tests\avalonia\README.md

Interfaces:
- TC-WEB-ENV-001.md is the source record consumed by tests\web\environment.spec.ts.
- The TestCase schema is used by future API, Web, Avalonia, and manual records.

- [ ] Step 1: Create test-cases\README.md.

    Define the required fields TestCaseId, Module, Title, Priority, TestType, Preconditions, Steps, ExpectedResult, AutomationType, AutomationFramework, RequirementSource, and Notes. Define AutomationType as AUTO, AUTO_PARTIAL, or MANUAL. Define the statuses PASS, FAIL, ERROR, BLOCKED, MANUAL, and SKIPPED with the approved meanings. State that the order is requirement/design/flow -> TestCase -> automation classification -> script -> execution -> report.

- [ ] Step 2: Create test-cases\TC-WEB-ENV-001.md with this record.

    TestCaseId: TC-WEB-ENV-001
    Module: WEB
    Title: Playwright environment can launch Chromium and create a page
    Priority: P0
    TestType: Environment
    Preconditions: Project dependencies and Chromium are installed
    Steps: Launch managed Chromium; create a page; navigate to about:blank; verify the URL
    ExpectedResult: Chromium starts, a page is created, and the URL is about:blank
    AutomationType: AUTO
    AutomationFramework: Playwright Test
    RequirementSource: 2026-08-17 initialization request, Phase 1
    Notes: No business system or side-effecting network operation; implementation is tests/web/environment.spec.ts

- [ ] Step 3: Create tests\avalonia\README.md stating that Phase 1 installs no Appium package, driver, or desktop test, and that the planned order is Avalonia Headless first, then a small Appium real desktop E2E set.

- [ ] Step 4: Commit.

    git add test-cases tests/avalonia/README.md
    git diff --cached --check
    git commit -m "docs: define TestCase and execution status conventions"

### Task 4: Add repository rules, Playwright configuration, and the environment test

Files:
- Create: AGENTS.md
- Create: README.md
- Create: .gitignore
- Create: playwright.config.ts
- Create: tests\web\environment.spec.ts

Interfaces:
- playwright.config.ts targets only tests/web, uses Chromium, writes the HTML report to reports/playwright-report, and writes result evidence to artifacts/test-results.
- tests/web/environment.spec.ts implements TC-WEB-ENV-001.

- [ ] Step 1: Create AGENTS.md with the approved rules: TestCase first; unique IDs and mapping; no product-code changes; role/label/test-id/stable semantic locators; no coordinate clicks or fixed sleeps; auto-wait and explicit conditions; real execution; status distinctions; evidence preservation; product-bug reporting; Avalonia Headless before Appium; no secrets.

- [ ] Step 2: Create playwright.config.ts with this exact configuration.

    import { defineConfig } from '@playwright/test';

    export default defineConfig({
      testDir: './tests/web',
      timeout: 30_000,
      expect: { timeout: 5_000 },
      fullyParallel: false,
      reporter: [
        ['list'],
        ['html', { outputFolder: 'reports/playwright-report', open: 'never' }],
      ],
      outputDir: 'artifacts/test-results',
      use: {
        browserName: 'chromium',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        video: 'off',
      },
    });

- [ ] Step 3: Create tests\web\environment.spec.ts with this exact test.

    import { expect, test } from '@playwright/test';

    test('TC-WEB-ENV-001 - Playwright environment can launch Chromium', async ({ page }) => {
      await page.goto('about:blank');
      await expect(page).toHaveURL('about:blank');
    });

    Keep the assertion and execute the real browser test; do not skip it.

- [ ] Step 4: Create README.md with project goal, approved pipeline, current completed scope, deferred scope, directory responsibilities, status definitions, and recovery commands:

    npm ci
    npx playwright install
    npx playwright test

    State that existing Node.js, Git, .NET SDK, and GitHub CLI are reused, Appium is not installed, and node_modules is not committed.

- [ ] Step 5: Create .gitignore containing:

    node_modules/
    playwright-report/
    test-results/
    artifacts/
    *.log

    .env
    .env.*
    !.env.example

    bin/
    obj/
    .vs/
    .idea/
    .vscode/

- [ ] Step 6: Execute the focused test.

    npx playwright test

    Expected: TC-WEB-ENV-001 passes in Chromium.

- [ ] Step 7: Commit.

    git add AGENTS.md README.md .gitignore playwright.config.ts tests/web/environment.spec.ts
    git diff --cached --check
    git commit -m "feat: add Playwright web environment test"

### Task 5: Write the initialization report from actual results

Files:
- Create: reports\initialization-report.md

Interfaces:
- Provides the user-facing audit of reused tools, actual additions, verification results, repository state, and remaining work.

- [ ] Step 1: Collect evidence.

    git status -sb
    git remote -v
    git log -1 --oneline
    npm list @playwright/test
    npx playwright --version
    npx playwright test

- [ ] Step 2: Write the report sections Environment, Installed By This Task, Repository, Verification, and Remaining Work. Record actual command outputs. State explicitly that Node.js was detected, reused, and not installed; list only @playwright/test and Chromium as additions; record the actual remote URL, main branch, test result, push result, and working-tree result.

- [ ] Step 3: Validate UTF-8 and commit.

    $p='E:\automated-testing\reports\initialization-report.md'
    $utf8=[Text.UTF8Encoding]::new($false,$true)
    [void]$utf8.GetString([IO.File]::ReadAllBytes($p))
    git add reports/initialization-report.md
    git diff --cached --check
    git commit -m "docs: record automation workspace initialization"

### Task 6: Create and verify the private GitHub repository

Files:
- Modify: local Git configuration by adding origin
- Remote: create mrricardo16/test-automation only when the existence check confirms absence

Interfaces:
- Produces origin tracking main on the private GitHub repository.

- [ ] Step 1: Re-check authentication and remote existence.

    gh auth status
    gh repo view test-automation

    Expected: authentication is active. If the repository now exists, stop creation and inspect safe connection; never overwrite it.

- [ ] Step 2: Create and push without force, only when absent.

    gh repo create test-automation --private --source . --remote origin --push

- [ ] Step 3: Verify synchronization.

    git fetch origin main
    git status -sb
    git remote -v
    git log -1 --oneline
    git rev-list --left-right --count origin/main...HEAD
    gh repo view mrricardo16/test-automation --json nameWithOwner,isPrivate,defaultBranchRef,url

    Expected: private repository, default branch main, divergence 0 0, and clean working tree.

- [ ] Step 4: Perform final safety and UTF-8 checks.

    git ls-files
    git status --short
    rg -n -i "(gho_|github_pat_|api[_-]?key|password|secret|token)" --glob '!package-lock.json' --glob '!docs/superpowers/**' .
    Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\artifacts\\|\\reports\\playwright-report\\' } | ForEach-Object {
      $utf8=[Text.UTF8Encoding]::new($false,$true)
      [void]$utf8.GetString([IO.File]::ReadAllBytes($_.FullName))
    }

    Expected: no secret matches, no ignored artifacts are tracked, all committed text decodes as UTF-8, and git status --short is empty.

