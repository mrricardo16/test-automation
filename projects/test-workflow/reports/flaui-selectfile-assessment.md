# Phase 3B-POC4：FlaUI FileName Edit 单文件选择评估

执行日期：2026-08-18 10:15（Asia/Shanghai）
POC：`POC-FLAUI-SELECTFILE-001`
范围：仅验证一个完整绝对路径通过 Windows File Dialog 的 FileName Edit 选择；未执行多文件、目录导航或完整 `TC-AVA-E2E-001`。

## 最终 57 项结果

1. 起始 Git 状态：仓库在 POC4 开始前已有 Phase 3B/POC1/POC2/POC3 未提交修改；本次保留全部既有修改，POC4 新增内容为 `SelectFilePoc.cs`、`run-poc4.mjs`、`select-file-contract.mjs`、契约测试、计划文档和本报告。
2. `SourceTreeHashBefore`：`81E254DDAC43ED1B3B283908480AD6F1066B5288175D7BDF17F09D0F8E2F32C0`。
3. 单文件路径 `Test-Path`：`PASS` / `True`。
4. `TC-AVA-E2E-ENV-001`：`PASS`（此前本轮先行回归，1/1）。
5. `HZ.LogClient PID`：`26476`。
6. `Appium PID`：`34252`。
7. `WinAppDriver PID`：`35412`（由 Appium Windows Driver 管理）。
8. `AnalysisPage`：`found`。
9. File Dialog 入口：`Appium` 元素点击；随后由 FlaUI 接管原生 Dialog。
10. File Dialog 真实打开：`YES`。
11. Dialog HWND：`1445388`。
12. Dialog ClassName：`#32770`。
13. Dialog Title：`选择日志包`。
14. Dialog PID：`26476`。
15. FlaUI 是否 Attach 同一 PID：`YES`；`Application.Attach(HZ.LogClient PID)`，Dialog PID 与产品 PID 一致。
16. 是否获取 `#32770`：`YES`；通过实际观测 HWND 直连 UIA3。
17. 是否找到 FileName Edit：`YES`。
18. FileName AutomationId：`1148`。
19. FileName Name：`文件名(N):`。
20. FileName ClassName：`Edit`。
21. FileName ControlType：`Edit`。
22. FileName ValuePattern：`true`。
23. 是否使用 `fileNameEditor.AsTextBox().Text`：`YES`。
24. 实际写入值：`E:\测试项目部署\测试项目部署\RSS\log\hz.carlog_20260717160532098_20260717162532098.zip`。
25. `FileNameValueAfter`：与完整绝对路径逐字符一致，`exact = true`。
26. 是否操作地址栏：`No`。
27. 是否使用 Ctrl+L：`No`。
28. 是否使用 Alt+D：`No`。
29. 是否使用 Clipboard：`No`。
30. 是否使用 `/keys`：`No`。
31. 是否使用 W3C Actions：`No`。
32. 是否使用固定坐标：`No`。
33. 是否找到 Open Button：`YES`。
34. Open AutomationId：`1`。
35. Open Name：`打开(O)`。
36. 是否使用 `openButton.Click(moveMouse:false)`：`YES`。
37. Dialog 是否关闭：`YES`。
38. `DialogCloseDuration`：`2653 ms`。
39. 是否返回 `AnalysisPage`：`YES`。
40. `LogFileTextBox` 实际值 Before：空字符串。
41. `LogFileTextBox` 实际值 After：`hz.carlog_20260717160532098_20260717162532098.zip`。
42. 其他导入状态变化：未观察到额外摘要控件值；本 POC 不深入解析业务结果。
43. 是否证明产品真实接收文件：`YES`；Dialog 关闭后 Analysis 页 `LogFileTextBox` 出现目标文件名。
44. `POC-FLAUI-SELECTFILE-001`：`PASS`。
45. 失败层级：无；本轮未失败。
46. 是否复刻成功 CodexTestWorkspace `SelectFileAsync` 思路：`YES`；FileName Edit 赋值和 Open 均采用 FlaUI UIA3 元素操作。本轮另增加了对真实 FileName Edit 的显式 `Focus()` 与元素点击，以修正输入框未激活问题。
47. `DirectoryNavigation` 是否仍需要：`No`。
48. 是否建议下一轮验证 `"a.zip" "b.zip" "c.zip"`：仅记录为 `POC5` 候选；本轮未执行。
49. 是否建议执行 `Phase 3B-CLOSE`：`No`；继续保持 `HOLD`。
50. `SourceTreeHashAfter`：`81E254DDAC43ED1B3B283908480AD6F1066B5288175D7BDF17F09D0F8E2F32C0`。
51. Hash 是否一致：`YES`；文件数 Before/After 均为 `41`。
52. 是否修改真实业务源码：`No`；`D:\HZ_RSS40\03_trunk\src_m_logclient` 未修改。
53. 是否产生 commit：`No`。
54. 是否 push：`No`。
55. 是否清理本轮进程和端口：`YES`；本轮产品、Appium、WinAppDriver 均已清理，4723/4724/4725 无本轮残留监听；未关闭其他用户进程。
56. Evidence 位置：[projects/test-workflow/artifacts/phase3b-flaui-selectfile-poc](../projects/test-workflow/artifacts/phase3b-flaui-selectfile-poc/)。关键证据包括 `poc4-result.json`、`poc4-orchestration.json`、`dialog-before-input.png`、`filename-focused.png`、`filename-after-input.json`、`after-input.png`、`open-button.json`、`dialog-tree.json`、`analysis-after-select.xml`、`analysis-after-select.png`、`processes.json`。
57. 下一步建议：停止本轮；如后续单独立项，进入 `POC5 - same-directory multi-file basename selection`，不要自动扩展为完整业务 E2E。

## 关键结论

```text
CodexTestWorkspace SelectFile strategy
= REPRODUCED ON HZ.LogClient

Single-file Native File Dialog automation
= PASS

AbsoluteSingleFilePathViaFileNameEdit
= PASS

DirectoryNavigationRequired
= No

Phase 3B-CLOSE
= HOLD
```

## 本轮修正点

用户反馈“文件选择器打开后未选中输入框”成立。原实现找到 Dialog 后直接赋值，没有显式激活 FileName Edit；同时 Appium 点击后的窗口检查只有一次，存在对话框出现时序误判。POC4 现已改为：

1. 等待并记录真实 `#32770` Dialog；
2. 将实际观测到的 Dialog HWND 交给 FlaUI UIA3 `FromHandle`；
3. 对 `AutomationId=1148` 的 FileName Edit 执行 `Focus()` 和该元素自身 `Click(moveMouse:false)`；
4. 再执行 `fileNameEditor.AsTextBox().Text = filePath`；
5. 由 Appium Windows Driver 管理 WinAppDriver，移除脚本手工启动的重复后端。

本轮未修改正式 TestCase、真实业务源码或其他 Phase。
