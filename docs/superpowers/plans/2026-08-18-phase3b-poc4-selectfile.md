# Phase 3B-POC4 SelectFile Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 `tests/avalonia/e2e/flaui-poc/` Harness 中复刻单文件 `SelectFileAsync` 语义，验证完整绝对文件路径写入 FileName Edit 后 Open 是否关闭 Dialog 并被 HZ.LogClient Analysis 页面接收。

**Architecture:** 复用已有 FlaUI 5.0.0 UIA3 工程和 Appium/WinAppDriver 产品启动链。新增独立的 POC4 入口与证据目录，不修改正式 Appium fixture、正式 TestCase 或真实业务源码；入口策略按 Appium 实际 Dialog 观察结果选择 Appium 或同 PID 的 FlaUI Invoke/element click。

**Tech Stack:** .NET 8 Windows、FlaUI.Core 5.0.0、FlaUI.UIA3 5.0.0、Node.js 运行编排、Appium 3.6.0、WinAppDriver 1.2.1、Node built-in test。

## Global Constraints

- 真实源码 `D:\HZ_RSS40\03_trunk\src_m_logclient` 严格只读。
- 只测试一个完整绝对文件路径，不测试目录导航、三文件多选、SelectionItem、真实完整日志导入或 Phase 3B-CLOSE。
- 禁止地址栏、Ctrl+L、Alt+D、Clipboard、`/keys`、W3C Actions、固定屏幕坐标和键盘 Hack。
- 优先复刻 `AsTextBox().Text = filePath` 与 `Click(moveMouse:false)` 语义；不优先替换为底层 ValuePattern SetValue。
- 只允许一个由 Appium 启动的 HZ.LogClient 实例；只清理本轮创建的进程和端口。
- 本轮不修改正式 `TC-AVA-E2E-001`，不 commit，不 push。
- 复刻仓库源码不可直接访问时，只依据用户提供的已验证接口语义实现，并在报告中明确说明。

---

### Task 1: Baseline and single-file contract

**Files:**
- Create: `tests/avalonia/e2e/flaui-poc/select-file-contract.mjs`
- Test: `tests/avalonia/e2e/flaui-poc/select-file-contract.test.mjs`
- Create: `docs/superpowers/plans/2026-08-18-phase3b-poc4-selectfile.md`

**Interfaces:**
- Produces `buildSingleFileSelection(filePath)` returning `{ filePath, isSingleFile: true }` and rejecting empty paths, nonexistent files, and multiple path values.

- [ ] **Step 1: Write the failing contract test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSingleFileSelection } from './select-file-contract.mjs';

test('accepts exactly one existing absolute ZIP path', () => {
  const filePath = String.raw`E:\测试项目部署\测试项目部署\RSS\log\hz.carlog_20260717160532098_20260717162532098.zip`;
  const selection = buildSingleFileSelection(filePath);
  assert.deepEqual(selection, { filePath, isSingleFile: true });
});

test('rejects more than one path value', () => {
  assert.throws(() => buildSingleFileSelection('a.zip b.zip'), /single file/i);
});
```

- [ ] **Step 2: Run the test and verify the expected missing-module failure**

Run:

```powershell
node --test tests/avalonia/e2e/flaui-poc/select-file-contract.test.mjs
```

Expected: FAIL because `select-file-contract.mjs` does not exist yet.

- [ ] **Step 3: Implement the minimal contract**

```js
import fs from 'node:fs';
import path from 'node:path';

export function buildSingleFileSelection(filePath) {
  if (typeof filePath !== 'string' || !filePath.trim()) {
    throw new Error('single file path is required');
  }
  const normalized = path.normalize(filePath);
  if (/\r|\n/u.test(normalized) || (/[\s]/u.test(normalized) && !fs.existsSync(normalized))) {
    throw new Error('single file path is required');
  }
  if (!path.isAbsolute(normalized) || !fs.existsSync(normalized)) {
    throw new Error(`test data file does not exist: ${filePath}`);
  }
  return { filePath: normalized, isSingleFile: true };
}
```

- [ ] **Step 4: Run the contract test and preflight Test-Path**

Run:

```powershell
node --test tests/avalonia/e2e/flaui-poc/select-file-contract.test.mjs
Test-Path -LiteralPath 'E:\测试项目部署\测试项目部署\RSS\log\hz.carlog_20260717160532098_20260717162532098.zip'
```

Expected: two contract tests PASS and `True`. If `False`, stop with `BLOCKED_TEST_DATA`.

### Task 2: POC4 FlaUI single-file flow

**Files:**
- Create: `tests/avalonia/e2e/flaui-poc/SelectFilePoc.cs`
- Modify: `tests/avalonia/e2e/flaui-poc/Program.cs`
- Test: `dotnet build tests/avalonia/e2e/flaui-poc/FlaUI.FileDialog.Poc.csproj --configuration Release`

**Interfaces:**
- `SelectFilePoc.Run(string[] args)` consumes `--pid`, `--evidence-dir`, `--file-path`, `--appium-click-status`.
- Produces `poc4-result.json` with the required 57 result fields and stops at the first non-recoverable layer.

- [ ] **Step 1: Add the failing dispatch test**

Add a compile-time dispatch call in `Program.cs` before the existing POC3 flow:

```csharp
if (args.Contains("--select-file", StringComparer.Ordinal))
{
    return SelectFilePoc.Run(args);
}
```

Run:

```powershell
dotnet build tests/avalonia/e2e/flaui-poc/FlaUI.FileDialog.Poc.csproj --configuration Release
```

Expected: FAIL because `SelectFilePoc` does not exist.

- [ ] **Step 2: Implement the minimum same-PID attach and dialog flow**

The implementation must execute this exact sequence:

```csharp
Application.Attach(pid);
using var automation = new UIA3Automation();
var dialog = await WaitForFileDialogAsync(pid, timeout: TimeSpan.FromSeconds(10));
var fileNameEditor = FindFileNameEditor(dialog);
var filePath = options.FilePath;
fileNameEditor.AsTextBox().Text = filePath;
var fileNameValueAfter = ReadValue(fileNameEditor);
var openButton = FindOpenButton(dialog);
openButton.Click(moveMouse: false);
var dialogClosed = await WaitForDialogClosedAsync(pid, timeout: TimeSpan.FromSeconds(10));
```

All searches after Dialog discovery must be scoped to the `#32770` element. `WaitForFileDialogAsync` must filter by target PID and `ClassName == "#32770"`; it must not dump the full Desktop tree. FileName matching must prioritize confirmed `AutomationId == "1148"`, then Name containing `文件名` or `File name`, and must exclude address/search controls. Open matching must prioritize AutomationId `1`, then `打开(O)` or `Open`, and require enabled state. If Dialog does not appear in 10 seconds, return `ERROR_DIALOG_ENTRY`; do not try another input technique.

- [ ] **Step 3: Record product feedback without asserting a guessed string**

After Dialog closure, obtain AnalysisPage and LogFileTextBox through the existing Appium session or same-PID FlaUI tree. Record both values and any visible package/status feedback. Mark `productFileReceived=true` only when the UI shows a real state change attributable to the selected file; otherwise classify `FAIL_PRODUCT_FILE_NOT_RECEIVED` or `VALUE_WRITE_UNVERIFIED` according to the observed layer.

- [ ] **Step 4: Build and verify the dispatch**

Run:

```powershell
dotnet build tests/avalonia/e2e/flaui-poc/FlaUI.FileDialog.Poc.csproj --configuration Release
```

Expected: PASS with 0 warnings and 0 errors.

### Task 3: POC4 Appium orchestration and evidence

**Files:**
- Create: `tests/avalonia/e2e/flaui-poc/run-poc4.mjs`
- Create: `artifacts/phase3b-flaui-selectfile-poc/` at runtime only

**Interfaces:**
- Runner starts only WAD, Appium and one product instance; it invokes the existing environment case first and then `dotnet run ... --select-file`.
- Runner writes PIDs, Appium entry result, FlaUI result, source hash before/after, and cleanup status.

- [ ] **Step 1: Run environment and data gates**

Run:

```powershell
Test-Path -LiteralPath 'E:\测试项目部署\测试项目部署\RSS\log\hz.carlog_20260717160532098_20260717162532098.zip'
$env:APPIUM_PORT='4725'
node --test tests/avalonia/e2e/appium/TC_AVA_E2E_ENV_001_AppiumEnvironment.spec.mjs
```

Expected: `True` and `1 pass`. If either gate fails, write the blocked result and stop.

- [ ] **Step 2: Start the single-product POC flow**

The runner must use WAD on 4723 and Appium on 4725, keep WAD stdin open, create one Appium session using the configured real executable, and call the existing Analysis `LogFileTextBox` sibling button. It must classify an HTTP success with no observed `#32770` as `NO_DIALOG`, then allow the FlaUI Strategy B entry only for that actual non-success condition.

- [ ] **Step 3: Save required evidence**

Write only evidence reached by the run:

```text
artifacts/phase3b-flaui-selectfile-poc/poc4-result.json
artifacts/phase3b-flaui-selectfile-poc/dialog-before-input.png
artifacts/phase3b-flaui-selectfile-poc/dialog-tree.json
artifacts/phase3b-flaui-selectfile-poc/filename-editor.json
artifacts/phase3b-flaui-selectfile-poc/filename-after-input.json
artifacts/phase3b-flaui-selectfile-poc/open-button.json
artifacts/phase3b-flaui-selectfile-poc/after-open.png
artifacts/phase3b-flaui-selectfile-poc/analysis-after-select.xml
artifacts/phase3b-flaui-selectfile-poc/analysis-after-select.png
artifacts/phase3b-flaui-selectfile-poc/processes.json
```

Do not create placeholders for stages not reached.

- [ ] **Step 4: Clean only owned processes and ports**

Delete the Appium session and stop the runner-owned product, Appium and WinAppDriver. Verify no 4723/4725 listener and no runner-owned HZ.LogClient remains.

### Task 4: Report and final verification

**Files:**
- Create: `projects/test-workflow/reports/flaui-selectfile-assessment.md`
- Modify: none of the formal TestCase files

**Interfaces:**
- Report consumes `poc4-result.json`, environment output, Git checks and source hash output.
- Report produces the exact 57-item final result, including `AbsoluteSingleFilePathViaFileNameEdit`, `DirectoryNavigationRequired`, `POC-FLAUI-SELECTFILE-001`, and next step `POC5` only if the single-file flow passes.

- [ ] **Step 1: Compute source hash after the run**

Use the existing manifest algorithm over `D:\HZ_RSS40\03_trunk\src_m_logclient`, excluding `bin`/`obj`, and compare with `SourceTreeHashBefore` and file count.

- [ ] **Step 2: Write the report**

Record whether the result is `PASS`, `ERROR_DIALOG_ENTRY`, `ERROR_FILE_DIALOG_DISCOVERY`, `ERROR_FILENAME_EDIT_NOT_FOUND`, `ERROR_FILENAME_INPUT`, `ERROR_OPEN_BUTTON_NOT_FOUND`, `ERROR_FILE_DIALOG_NOT_CLOSED`, `FAIL_PRODUCT_FILE_NOT_RECEIVED`, or `VALUE_WRITE_UNVERIFIED`. Do not call an automation failure a product failure.

- [ ] **Step 3: Verify repository hygiene**

Run:

```powershell
node --check tests/avalonia/e2e/flaui-poc/run-poc4.mjs
dotnet build tests/avalonia/e2e/flaui-poc/FlaUI.FileDialog.Poc.csproj --no-restore --configuration Release
git diff --check
git rev-list --left-right --count origin/main...HEAD
git status --short
```

Expected: syntax/build pass, diff-check exit 0, remote sync `0 0`, no commit and no push. Verify all new Markdown/C#/JS files are UTF-8 without U+FFFD or trailing whitespace.

- [ ] **Step 4: Stop after POC4**

Do not start POC5, multi-file selection, full `TC-AVA-E2E-001`, or Phase 3B-CLOSE automatically.
