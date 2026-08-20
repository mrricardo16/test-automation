# Phase 3B-POC3：FlaUI UIA3 Native File Dialog Validation

日期：2026-08-18

## 1. Scope

本报告记录独立技术验证 `POC-FLAUI-FILEDIALOG-001`。本轮不修改真实 Avalonia 源码，不修改正式 Appium fixture，不执行日志导入、最终 Open、Replay、地图、报告导出或 Phase 3B-CLOSE。

真实产品：`E:\logclient\logclient20260812\net8.0\HZ.LogClient.exe`

真实源码：`D:\HZ_RSS40\03_trunk\src_m_logclient`，仅做完整性哈希，不修改。

目标目录：`E:\测试项目部署\测试项目部署\RSS\log`

目标文件：

```text
hz.carlog_20260717160532098_20260717162532098.zip
hz.carlog_20260717162532098_20260717164532098.zip
hz.carlog_20260717164532098_20260717170532098.zip
```

## 2. Environment

```text
起始 Git 状态：保留既有 Phase 3B/RUN/POC 未提交修改，未 reset、checkout 或 clean
git diff --check：通过；仅有既有 LF/CRLF 提示，无 whitespace error
origin/main...HEAD：0 0
TC-AVA-E2E-ENV-001：PASS（1/1）
FlaUI.Core：5.0.0
FlaUI.UIA3：5.0.0
NuGet 来源：https://api.nuget.org/v3/index.json
Target Framework：net8.0-windows（Windows .NET 8 UIA3 Harness）
WinAppDriver：1.2.1
Appium：3.6.0
Windows Driver：6.1.1
```

`FlaUI.Core` 和 `FlaUI.UIA3` 均来自官方 NuGet，未使用 fork 或第三方二进制。独立 Harness 已创建于：

```text
tests/avalonia/e2e/flaui-poc/FlaUI.FileDialog.Poc.csproj
tests/avalonia/e2e/flaui-poc/Program.cs
tests/avalonia/e2e/flaui-poc/run-poc3.mjs
tests/avalonia/e2e/flaui-poc/README.md
```

构建结果：`dotnet build --configuration Release = PASS`，0 warning、0 error。

## 3. Process and attach

最后一次 POC 运行记录：

```text
HZ.LogClient PID：35104
Appium PID：26096
WinAppDriver PID：32792
FlaUI Attach：PASS，PID=35104，与 Appium 启动的产品实例一致
MainWindow：PASS
MainWindow HWND：2098218
MainWindow Title：日志分析
MainWindow ClassName：MainWindow
Analysis：PASS，AutomationId=AnalysisPage
```

本轮没有手工启动第二个 HZ.LogClient。结束后本轮创建的产品、Appium、WinAppDriver 和端口均已清理。

## 4. Dialog entry

### Appium Strategy A

Appium 使用现有 Analysis 入口：

```text
//Edit[@AutomationId='LogFileTextBox']/following-sibling::Button[1]
```

Appium click 的 HTTP 响应为成功，但点击后由 winapp CLI 交叉检查得到：

```text
Appium click：HTTP success
实际 #32770：未观察到
HZ.LogClient 主窗口：仍存在，PID=35104
Dialog observed：false
```

因此本轮将其准确记录为：`AppiumClick = NO_DIALOG`，而不是把 HTTP 200 误判为 Dialog 已打开。

### FlaUI Strategy B

FlaUI UIA3 附加同一 PID 后找到 FileName 入口按钮：

```text
Name：选择
ControlType：Button
IsEnabled：true
IsOffscreen：false
InvokePattern：supported
```

调用：

```text
InvokePattern.Invoke()
```

调用本身返回，但等待 30 秒后仍未发现属于 PID=35104 的 `#32770`。本轮未使用坐标、鼠标、键盘、Clipboard、Ctrl+L、W3C Actions 或 `/keys`。

## 5. Dialog discovery and UIA3 tree

```text
真实 File Dialog：No（本轮两条入口路径均未产生 Dialog）
Dialog HWND：未获得
Dialog PID：未获得
Dialog ClassName：未获得
Dialog Title：未获得
FlaUI scoped 到 Dialog：未执行
Dialog 枚举耗时：30,000 ms 后超时
Edit 数量：未到达 Dialog
Button 数量：未到达 Dialog
List/ListItem 数量：未到达 Dialog
```

FlaUI 已完成主窗口级验证，但没有把不存在的 Dialog UIA 树伪造为证据。因此以下内容均为 `NOT REACHED`：

```text
FileName Edit
FileName AutomationId / ClassName / ValuePattern / CurrentValue
File List / ListItem
Open Button
Directory Navigation
SelectionItemPattern
Selection Container
```

## 6. Directory and multi-select

```text
目录导航方法：未进入 File Dialog，未执行
是否进入 E:\测试项目部署\测试项目部署\RSS\log：No / NOT REACHED
目录证据：无；winapp 窗口列表未出现 #32770
默认 rss_*.zip：未评估
三个目标 ZIP：未找到，未进入文件列表
File 1/2/3 SelectionItemPattern：NOT REACHED
SelectionPattern：NOT REACHED
CanSelectMultiple：NOT REACHED
第一个 Select：NOT REACHED
第二个 AddToSelection：NOT REACHED
第三个 AddToSelection：NOT REACHED
File 1/2/3 IsSelected：NOT REACHED
SelectedItems.Count：NOT REACHED
最终 Open：未调用
真实日志导入：未执行
```

## 7. Prohibited methods and performance

```text
固定坐标：No
Ctrl+L：No
Alt+D：No
W3C Actions：No
/keys：No
Clipboard：No
三个完整路径拼入 FileName：No
中文 Breadcrumb：No
键盘 Hack：No
```

FlaUI 计时记录：

```text
AttachDuration：约 106 ms
MainWindowLookupDuration：包含在 Attach/MainWindow 步骤，未单独持久化
DialogLookupDuration：30,000 ms timeout
DialogEnumerationDuration：NOT REACHED
FileNameLookupDuration：NOT REACHED
FileListEnumerationDuration：NOT REACHED
ZIPLookupDuration：NOT REACHED
SelectionDuration：NOT REACHED
```

本轮没有发生 25~30 秒的成功 scoped Dialog 查询；30 秒是等待不存在的 Dialog 入口条件，不是 Dialog 树查询性能结论。

## 8. Final assessment

```text
POC-FLAUI-FILEDIALOG-001 = ERROR_DIALOG_ENTRY
AppiumDialogOpen = NO_DIALOG
FlaUIDialogOpen = FAIL（Invoke 返回但无实际 #32770）
FlaUI File Dialog 自动化评价 = NOT_RECOMMENDED（当前入口链路）
是否建议 FlaUI 成为 Native Dialog Adapter：当前不建议
是否建议继续 TC-AVA-E2E-001 自动化：暂不建议，保持未完成状态
是否建议执行 Phase 3B-CLOSE：本轮不执行，等待用户审核
```

本轮已经证明：

```text
同一真实 HZ.LogClient PID 可被 FlaUI UIA3 attach
AnalysisPage 可访问
入口按钮暴露 InvokePattern
Appium click 返回成功不等于原生 Dialog 实际出现
Appium click 与 FlaUI Invoke 均未产生可发现的 #32770
```

因此本轮足以把当前入口链路分类为 `ERROR_DIALOG_ENTRY`，但不把 FileName Edit、目录导航或 SelectionItemPattern 误判为已失败；这些层级没有被真实执行到。

## 9. Integrity, evidence and delivery

```text
SourceTreeHashBefore：81E254DDAC43ED1B3B283908480AD6F1066B5288175D7BDF17F09D0F8E2F32C0
SourceTreeHashAfter：81E254DDAC43ED1B3B283908480AD6F1066B5288175D7BDF17F09D0F8E2F32C0
SourceFileCountBefore/After：41 / 41
Hash 一致：YES
是否修改真实业务源码：No
是否产生 commit：No
是否 push：No
是否清理本轮进程和端口：Yes
```

Evidence：

```text
projects/test-workflow/artifacts/phase3b-flaui-poc/flaui-poc-result.json
projects/test-workflow/artifacts/phase3b-flaui-poc/flaui-orchestration.json
projects/test-workflow/artifacts/phase3b-flaui-poc/environment.json
projects/test-workflow/artifacts/phase3b-flaui-poc/appium-session.json
projects/test-workflow/artifacts/phase3b-flaui-poc/flaui-mainwindow.json
projects/test-workflow/artifacts/phase3b-flaui-poc/winapp-after-appium-click.json
projects/test-workflow/artifacts/phase3b-flaui-poc/flaui-console.json
projects/test-workflow/artifacts/phase3b-flaui-poc/appium-server.log
projects/test-workflow/artifacts/phase3b-flaui-poc/winappdriver.log
projects/test-workflow/artifacts/phase3b/environment-probe.json
projects/test-workflow/artifacts/phase3b/appium-status.json
projects/test-workflow/artifacts/phase3b/appium-page-source-initial.xml
```

由于 Dialog 入口未成功，本轮没有生成 `flaui-dialog-tree.json`、`flaui-dialog-edits.json`、`flaui-dialog-buttons.json`、`flaui-dialog-listitems.json`、`flaui-dialog-patterns.json`、`before-navigation.png`、`target-directory.png`、`three-files-selected.png` 或 `selection-state.json`；不存在成功状态时不生成伪证据。

## 10. Next step

本轮停止。不要自动进入完整日志导入、三文件多选、Report Export、Replay、Map 或 Phase 3B-CLOSE。下一步由用户审核是否接受：

```text
Native File Dialog entry = AUTOMATION_BOUNDARY
TC-AVA-E2E-001 = MANUAL_PREREQUISITE 或 BLOCKED_AUTOMATION_CAPABILITY
```
