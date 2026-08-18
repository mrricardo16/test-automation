# Phase 3B-POC：Native File Dialog UIA Multi-Select 评估

**日期：** 2026-08-17

**POC：** `POC-NATIVE-FILEDIALOG-001`

**真实产品：** `E:\logclient\logclient20260812\net8.0\HZ.LogClient.exe`
**真实源码：** `D:\HZ_RSS40\03_trunk\src_m_logclient`（只读）

## 1. 范围和工作区保护

本次没有重新执行完整 Phase 3B-RUN，没有执行日志导入、报告、Replay、地图或 POC-002，也没有提交或推送。

本次开始前已经存在、未由本 POC 产生的工作区修改如下，全部保留：

```text
M  config/local-projects.example.json
M  reports/real-avalonia-phase3b-report.md
M  test-cases/avalonia/TC-AVA-E2E-001.md
M  test-cases/avalonia/TC-AVA-E2E-ENV-001.md
M  tests/avalonia/e2e/README.md
M  tests/avalonia/e2e/appium/TC_AVA_E2E_001_RealLogImport.spec.mjs
M  tests/avalonia/e2e/helpers/appium-session.mjs
M  tests/avalonia/e2e/helpers/evidence.mjs
M  tests/avalonia/e2e/helpers/project-config.mjs
M  tests/avalonia/e2e/helpers/real-app-process.mjs
?? reports/future-e2e-candidates.md
?? reports/logclient-test-input-mapping.md
?? tests/avalonia/e2e/helpers/real-import-session.mjs
```

本 POC runner 和所有运行证据均位于已被 Git 忽略的：
`artifacts/phase3b-filedialog-poc/`。

## 2. winapp CLI 来源、安装和校验

`winapp --version`、`where.exe winapp`、`Get-Command winapp` 的初始结果均为不存在。

采用 Microsoft 官方 GitHub Release，不是镜像：

| 项目 | 结果 |
|---|---|
| Source URL | `https://github.com/microsoft/winappCli/releases/download/v0.6.0/winappcli-x64.zip` |
| Release 页面 | `https://github.com/microsoft/winappCli/releases/tag/v0.6.0` |
| Provider | Microsoft / `microsoft/winappCli` 官方 Release |
| File | `winappcli-x64.zip` |
| Size | `46,672,666` bytes |
| SHA-256 | `F6DC42E3B4E4709C8F617003008E2CFDD9A51735E04E7170D60EDDA258DB78A8` |
| Install method | portable extract only; no system PATH/registry/UAC/security-policy change |
| Executable | `E:\automated-testing\artifacts\phase3b-filedialog-poc\tooling\winapp.exe` |
| Version | `0.6.0` |
| Official checksum comparison | Release page did not publish a separate SHA-256 file; the value above is the locally computed hash of the official asset |

官方 Release 同时列出 MSIX 和 standalone x64 ZIP；本次选择 standalone ZIP，避免对系统安装状态产生额外变化。[Microsoft winappCli Release v0.6.0](https://github.com/microsoft/winappCli/releases/tag/v0.6.0)

## 3. 环境回归和进程

已知基线继续成立：

```text
Developer Mode = AVAILABLE
WinAppDriver 1.2.1 = PASS
Appium = 3.6.0
Appium Windows Driver = 6.1.1
TC-AVA-E2E-ENV-001 = PASS（此前已验证；本次 POC 重新验证同一启动链路）
```

本次 POC 实际启动并记录：

```text
WinAppDriver PID = 33052
Appium Server PID = 4920
HZ.LogClient.exe PID = 20784
Appium Server = http://127.0.0.1:4725/status ready
WinAppDriver = http://127.0.0.1:4723/status HTTP 200
```

收尾检查未发现本次启动的 `HZ.LogClient.exe`、`WinAppDriver.exe` 残留进程，4723/4725 也没有残留监听。

## 4. File Dialog 结果

Appium 真实建立 HZ.LogClient Session，进入 Analysis，并打开真实 Windows 文件选择器：

```text
Dialog title = 选择日志包
Dialog class = #32770
Dialog HWND = 917632
Dialog process = HZ.LogClient
```

`winapp ui list-windows --show-hidden --json` 成功找到上述 HWND；之后所有 inspect 都使用 `-w 917632`，没有获取整个 Desktop XML。

| Inspect | 结果 |
|---|---:|
| interactive depth 8 | 160 elements / 41,048 bytes / 约 1.1 s |
| scoped deep depth 12 | 200 elements / 45,313 bytes / 约 0.9 s |
| 最大单次 scoped locator/inspect | 约 1.7 s |
| 是否存在 25–30 秒单元素查询 | No |

## 5. 地址栏控制结论

识别结果：

```text
Address root selector = 41477
ControlType = Pane
ClassName = Address Band Root
AutomationId = 41477
Toolbar child selector = 1001
```

实际 UIA 属性显示 `41477` 只有 `IsKeyboardFocusable=True`，没有可用的 ValuePattern；`winapp ui set-value 41477 <target>` 命令耗时约 398 ms 并返回 elementId，但地址栏实际仍为：

```text
E:\测试项目部署\测试项目部署\RSS\Release\loganalysis\traffic\packages
```

随后按允许的 Strategy C 做了两次有界验证：

```text
winapp ui send-keys --verbatim <targetDirectory> --target 41477 --via send-input
winapp ui click 1001
winapp ui send-keys --verbatim <targetDirectory> --target 1001 --via send-input
```

两次都返回正常 input-injection 响应，但实际地址和文件列表未改变。没有使用 Ctrl+L、Alt+D、中文 breadcrumb 导航、旧 WinAppDriver `/keys` 或固定坐标。

因此：

```text
DirectoryNavigation = FAIL
Target directory entered = No
Evidence = scoped inspect after input still shows default traffic/packages path
Target ZIP visible = No
```

## 6. 三个固定 ZIP 和多选

目标目录中的三个固定 ZIP 在磁盘上存在，但由于 Dialog 无法离开默认目录，本次没有在当前 Dialog 中定位到它们：

```text
hz.carlog_20260717160532098_20260717162532098.zip
hz.carlog_20260717162532098_20260717164532098.zip
hz.carlog_20260717164532098_20260717170532098.zip
```

```text
File 1 selector = NOT REACHED
File 2 selector = NOT REACHED
File 3 selector = NOT REACHED
SelectionItemPattern = NOT EVALUATED
IsSelected(File 1/2/3) = NOT EVALUATED
MultiSelect = NOT REACHED
```

本次没有使用 W3C `/actions`，没有使用固定坐标，没有把完整路径拼到文件名框，没有通过搜索框规避多选，也没有点击“打开”。

## 7. POC 状态和停止边界

```text
[PASS] Appium / Windows Driver / WinAppDriver / HZ.LogClient 启动链路
[PASS] 真实 Windows File Dialog
[PASS] 获取真实 File Dialog HWND
[PASS] 仅 inspect 当前 HWND
[PASS] 无中文 breadcrumb 导航
[PASS] 无 Ctrl+L
[PASS] 无固定坐标
[FAIL] UIA 地址栏实际导航到目标目录
[NOT REACHED] 三个固定 ZIP 定位
[NOT REACHED] 三文件真实多选
[NOT REACHED] IsSelected=true 验证
```

最终：

```text
POC-NATIVE-FILEDIALOG-001 = FAIL
POC-NATIVE-FILEDIALOG-002 = NOT EXECUTED
TC-AVA-E2E-001 = NOT EXECUTED
```

Runner 原始结果保存在 `artifacts/phase3b-filedialog-poc/poc-result.json`；其超时点是“目标 ZIP 未出现在实际 Dialog UI 状态”，按 Case 状态规则归类为 FAIL，而不是把命令返回成功误判为 PASS。

## 8. Evidence

已生成：

```text
artifacts/phase3b-filedialog-poc/file-dialog-windows.json
artifacts/phase3b-filedialog-poc/file-dialog-inspect-before.txt
artifacts/phase3b-filedialog-poc/file-dialog-inspect-before-deep.txt
artifacts/phase3b-filedialog-poc/file-dialog-inspect-after-address-set.txt
artifacts/phase3b-filedialog-poc/file-dialog-inspect-target-directory.txt
artifacts/phase3b-filedialog-poc/dialog-before-navigation.png
artifacts/phase3b-filedialog-poc/dialog-target-directory.png
artifacts/phase3b-filedialog-poc/selection-state.json
artifacts/phase3b-filedialog-poc/winappdriver.log
artifacts/phase3b-filedialog-poc/appium-server.log
```

`dialog-three-files-selected.png` 未生成，因为多选前的目录导航已经失败；`selection-state.json` 为空数组，表示没有伪造选择结果。

## 9. 真实源码完整性和 Git

使用与 Phase 2C 的 manifest 规则一致的当前实测方法：实际项目目录下枚举文件，排除 `bin`/`obj`，相对路径转小写、记录文件长度和单文件 SHA-256，按大小写敏感顺序排序，用 LF UTF-8 manifest 再做 SHA-256。

```text
SourceTreeHashBefore=81E254DDAC43ED1B3B283908480AD6F1066B5288175D7BDF17F09D0F8E2F32C0
SourceFileCountBefore=41
SourceTreeHashAfter=81E254DDAC43ED1B3B283908480AD6F1066B5288175D7BDF17F09D0F8E2F32C0
SourceFileCountAfter=41
Equal=YES
```

```text
是否修改真实业务源码：No
是否产生新的 Git commit：No
是否 push：No
```

## 10. 最终评价和下一步

```text
winapp CLI 方案评价 = PARTIALLY_RECOMMENDED
```

推荐保留 winapp CLI 用于：

```text
list-windows → 精确获取 Dialog HWND
scoped inspect → 当前 Dialog 结构证据
get-property → UIA 属性和 Pattern 能力诊断
screenshot → Dialog 证据
```

当前不建议把本方案直接并回 `TC-AVA-E2E-001`，因为地址栏 `41477` 暴露为不可写 Pane，且两种官方 CLI 输入路径均未改变真实目录，后续文件选择和多选没有可靠前置条件。

下一步仅建议另开一个独立技术 POC，研究原生 `UIAutomationClient` / FlaUI 对标准 `IFileDialog` 地址编辑模式和 `SelectionItemPattern.AddToSelection` 的直接能力；在目录导航能力单独 PASS 前，不继续扩大业务 Case，也不执行 POC-002。

## POC2 / POC-NATIVE-FILEDIALOG-003：FileName Edit Directory Navigation

### Scope and preconditions

本轮只验证 Windows 原生文件选择器的 FileName Edit 是否能通过 UIA `set-value` 写入单个目录路径，再通过 Open 进入该目录。不执行多文件选择、日志导入、Replay、地图、报告导出，也不新增正式 TestCase。

起始检查结果：

```text
既有工作区未提交修改：已保留，未 reset / checkout / 覆盖
git diff --check：通过（既有文件仅有换行符提示，无 whitespace error）
origin/main...HEAD：0 0
SourceTreeHashBefore：81E254DDAC43ED1B3B283908480AD6F1066B5288175D7BDF17F09D0F8E2F32C0
SourceFileCountBefore：41
```

`TC-AVA-E2E-ENV-001` 先行执行并通过：`1/1 PASS`。WinAppDriver、Appium、真实产品启动和环境 Session 均可建立。

### Runtime evidence

```text
WinAppDriver PID：24596
Appium PID：23396
HZ.LogClient PID：33080
Appium Session：已建立
MainWindow / AnalysisPage：已找到
真实 HZ.LogClient.exe：是，由 Appium 启动
```

主窗口 UIA 树已确认 FileName 导入入口：`Edit AutomationId=LogFileTextBox` 后的第一个 `Button Name=选择`，其 UIA 源证据为 `IsEnabled=True`、`IsOffscreen=False`。Appium 读取的 `Enabled` / `Displayed` 属性为 `null`，因此本轮仅依据已保存的 UIA Page Source 和非 Offscreen 的第一个同名按钮选择器选择，不使用坐标。

### File Dialog result

尝试点击上述 FileName 入口按钮时，Appium/WAD 返回 HTTP 500：

```text
ProxyRequestError: Request failed with status code 500
element=42.2230180.4.13982202/click
```

结果：

```text
File Dialog HWND：未获得
File Dialog 是否真实打开：No（本次入口点击未成功，未观察到 #32770）
scoped inspect：未执行；耗时不适用
FileName Edit：未到达，Selector / AutomationId / ControlType / ValuePattern / ValueBefore 均未评估
set-value：未执行
FileNameValueAfter：未产生；目标值未验证
Open Button：未定位
InvokePattern：未执行
Invoke：未执行
Invoke 后 Dialog：不适用
目标目录：未确认
目标 ZIP hz.carlog_20260717160532098_20260717162532098.zip：未确认
默认目录 rss_*.zip：未评估
```

本轮没有使用以下禁止方法：

```text
Ctrl+L：No
Alt+D：No
Clipboard：No
W3C Actions：No
/keys：No
固定坐标：No
中文 Breadcrumb：No
```

`MaxLocatorDuration=58 ms`；由于在入口点击失败前未进入 File Dialog，未产生本轮 Dialog scoped locator 慢查询。

### Final classification

```text
POC-NATIVE-FILEDIALOG-003 = ERROR_DIALOG_BEHAVIOR
NATIVE_FILE_DIALOG_DIRECTORY_NAVIGATION = AUTOMATION_BOUNDARY
TC-AVA-E2E-001 = 未执行
```

失败层级是“真实 File Dialog 入口的 Appium/WAD 元素点击”，尚未进入 FileName Edit 的 `set-value` 验证层。因此不能将本轮结果解释为 FileName Edit ValuePattern 已失败，也不能继续切换到 SendKeys、Clipboard、AutoHotkey、坐标或其他输入技巧。

winapp CLI 最终评价仍为：`PARTIALLY_RECOMMENDED`。它适合继续用于已验证的 `list-windows`、指定 HWND 的 scoped inspect、UIA 属性诊断和截图；当前不具备完成本条 FileName 目录导航链路的证据。

建议：`TC-AVA-E2E-001` 暂按 `MANUAL_PREREQUISITE` 或 `BLOCKED_AUTOMATION_CAPABILITY` 处理；不建议进入下一轮三文件多选，除非用户明确决定先解决原生 File Dialog 入口的自动化边界。

### Integrity and cleanup

```text
SourceTreeHashAfter：81E254DDAC43ED1B3B283908480AD6F1066B5288175D7BDF17F09D0F8E2F32C0
SourceFileCountAfter：41
Hash 一致：YES
是否修改真实业务源码：No
本轮 Appium Session / Appium Server / WinAppDriver / HZ.LogClient：已清理
本轮残留进程和 4723 / 4725 端口：未发现
是否产生 commit：No
是否 push：No
```

本轮证据保存在被 Git 忽略的 `artifacts/phase3b-filedialog-poc2/`，包括 `poc3-result.json`、`main-before-dialog.xml`、`analysis-import-buttons.json`、Appium/WAD 日志和 POC runner；未提交安装包或运行产物。
