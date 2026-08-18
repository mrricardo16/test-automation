# FlaUI UIA3 Native File Dialog POC

`POC-FLAUI-FILEDIALOG-001` 是一个独立的 .NET 8 技术验证 Harness，不属于正式 Appium fixture。

它接收由 Appium 启动的唯一 `HZ.LogClient.exe` PID，使用 FlaUI UIA3 附加同一进程，优先等待 Appium 打开的标准 `#32770` File Dialog；如果入口点击返回 HTTP 500，则通过 Analysis 页面的 UIA `InvokePattern` 打开对话框。

POC 只验证：

- `#32770` Dialog 的 scoped UIA3 结构；
- FileName Edit 的 ValuePattern 和单目录路径导航；
- 目标目录中三个固定 ZIP 的 ListItem / SelectionItemPattern；
- 三个元素的 `Select`、`AddToSelection` 和 `IsSelected`。

POC 在三个文件选中并保存证据后停止，不调用最终 Open，不导入日志，不修改真实业务源码。

## Run

由仓库根目录的 `run-poc3.mjs` 负责启动 WinAppDriver、Appium 和真实产品，然后调用：

```powershell
dotnet run --project tests/avalonia/e2e/flaui-poc/FlaUI.FileDialog.Poc.csproj --no-restore -- --pid <HZ.LogClient PID> --evidence-dir artifacts/phase3b-flaui-poc --target-directory <directory> --appium-click-status HTTP_500
```

依赖仅来自官方 NuGet：`FlaUI.Core` 和 `FlaUI.UIA3`，当前锁定 `5.0.0`。
