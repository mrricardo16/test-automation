# Real Avalonia Phase 3B Report

**Date:** 2026-08-17
**Phase:** `Phase 3B：真实 HZ.LogClient.exe Appium E2E 最小闭环`
**Repository:** `E:\automated-testing`
**Source evidence (read-only):** `D:\HZ_RSS40\03_trunk\src_m_logclient`
**Runtime evidence (read-only):** `E:\logclient\logclient20260812\net8.0`

## Environment

| Item | Observed value |
|---|---|
| OS | Windows 10 Professional, build 19044, x64 |
| Node | 24.15.0 |
| npm | 11.12.1 |
| .NET | 10.0.302 |
| Java | 26.0.1 |
| Appium | Project-local 3.6.0 |
| Appium Windows Driver | Project-local 6.1.1, installed by Appium CLI |
| WinAppDriver | Microsoft 1.2.1 installed; `C:\Program Files (x86)\Windows Application Driver\WinAppDriver.exe` |
| Android SDK | Not installed and not required |
| Target framework | `net8.0` |
| Avalonia | 11.3.14 from read-only `HZ.LogClient.csproj` |
| Executable | `E:\logclient\logclient20260812\net8.0\HZ.LogClient.exe` |
| Executable version | File/Product version `1.0.0.0` / `1.0.0` |
| DLL version | File/Product version `1.0.0.0` / `1.0.0` |

Official dependency references: [Appium Windows Driver](https://github.com/appium/appium-windows-driver), [Appium driver catalog](https://github.com/appium/appium/blob/master/packages/appium/docs/en/ecosystem/drivers.md), and [Microsoft WinAppDriver](https://github.com/microsoft/WinAppDriver).

## Installed this phase

- Added project-local exact `appium@3.6.0`.
- Added project-local exact `appium-windows-driver@6.1.1`.
- Completed the official Microsoft WinAppDriver 1.2.1 MSI installation after the initial discovery failure; the installed executable was located and directly verified.
- Did not install Android SDK, Android Studio, Selenium, iOS tooling, or unrelated drivers.

## TC-AVA-E2E-ENV-001

**Status:** `PASS`

Evidence:

- The installed WinAppDriver backend was first started directly and returned HTTP 200 from `http://127.0.0.1:4723/status`.
- The project-local Appium Server 3.6.0 started and returned `ready=true` from `/status`; its Windows Driver 6.1.1 matched the request and spawned the installed WinAppDriver backend.
- Appium session `0fe72f99-9ad3-415c-8941-2302fc9e0548` was created against the real executable.
- The session returned one MainWindow handle (`0x00110460`) and Page Source containing `ClassName="MainWindow"`, `FrameworkId="Avalonia"`, `AutomationId="AnalysisPage"`, and `AutomationId="LogFileTextBox"`.
- Evidence: `artifacts/phase3b/appium-status.json`, `artifacts/phase3b/environment-probe.json`, `artifacts/phase3b/appium-page-source-initial.xml`, and `artifacts/phase3b/appium-server.log` (ignored, local only).

This is an environment/backend block, not a product failure and not a locator failure.

## TC-AVA-E2E-001

**Status:** `BLOCKED`

The test was not executed because no approved non-sensitive parser-valid package was configured through `LOGCLIENT_TEST_PACKAGE`. It therefore did not trigger the file picker or claim an import result. The Windows backend blocker is resolved; the remaining business precondition is the approved fixture only.

**Actual deepest step:** local TestCase precondition inspection. Real executable launch, MainWindow connection, and initial Page Source retrieval were completed by `TC-AVA-E2E-ENV-001`; Analysis navigation, file picker selection, and import parsing were not executed.

## Test data

- Source: none; no real production/runtime package was copied.
- Sensitive: no package was used.
- Git: no package committed; local package path is intended to be ignored.
- Expected Result: once an approved package and Windows backend are available, the MVP assertion is that the selected package filename/package summary appears and AnalysisView leaves its initial empty-import state. A stable record count must only be asserted after the fixture contract is confirmed.

## Accessibility and locator assessment

The Appium session returned a real Accessibility Tree/Page Source for the Avalonia window. It contains stable AutomationId values such as `AnalysisPage` and `LogFileTextBox`; the Phase 3A source scan remains evidence that the product AXAML itself contains zero `AutomationProperties.AutomationId` values. Existing runtime AutomationIds are observed evidence, not a request to modify product source.

| Control | Current locator evidence | Risk | Recommended AutomationId |
|---|---|---|---|
| Analysis navigation entry | Real tree contains `AnalysisTabButton` | OBSERVED | `MainNavAnalysis` if a cross-version contract is required |
| Analysis import entry | Real tree contains `LogFileTextBox` and its adjacent `选择` button | PARTIAL | `AnalysisImportButton` |
| Import-success package summary | Real tree contains `CurrentPackageSummaryText` | OBSERVED | `AnalysisPackageSummary` if a cross-version contract is required |
| MainWindow | Real tree root has `ClassName="MainWindow"`, `FrameworkId="Avalonia"` | OBSERVED | `MainWindowRoot` if a stable product contract is required |

`PRODUCT_CHANGE_RECOMMENDED`: add stable AutomationIds only after product-team approval. No product AXAML or code was changed.

## Regression and source integrity

The Phase 3B repository changes must be followed by the full Phase 3A/Web regression. The source-tree hash uses the same manifest method as the prior phases, excluding `bin`, `obj`, `.vs`, build artifacts, and `*.tmp`/`*.temp` files. The Phase 3B before value captured for this run is:

```text
SourceTreeHashBefore=5BD2415BF16BD1C91264D28316DB6AFCB9DEF047E9DE265E0C68E1E8925E6643
SourceFileCount=41
```

The after value is recorded only after the final regression and must equal the before value. The real source and runtime directories were not edited by this repository task.

```text
SourceTreeHashAfter=5BD2415BF16BD1C91264D28316DB6AFCB9DEF047E9DE265E0C68E1E8925E6643
SourceFileCount=41
Equal=YES
```

## Stop boundary

Phase 3B stops after the environment Case passes. `TC-AVA-E2E-001` remains blocked only by the absent approved fixture. Do not begin `TC-AVA-E2E-002`, Replay E2E, map E2E, CI/CD, AutomationId changes, or product source changes.

## WinAppDriver blocker follow-up

**Date:** 2026-08-17

| Item | Result |
|---|---|
| Previous discovery | `where.exe WinAppDriver.exe`: not found; no executable in `C:\Program Files` or `C:\Program Files (x86)`; no uninstall entry; no process; no port 4723 listener |
| Source type | Official source; no mirror used |
| Source URL | `https://github.com/Microsoft/WinAppDriver/releases/download/v1.2.1/WindowsApplicationDriver_1.2.1.msi` |
| Release | Microsoft GitHub `WinAppDriver v1.2.1` |
| Download file | `WindowsApplicationDriver_1.2.1.msi` |
| Download location | `E:\automated-testing\artifacts\phase3b-fix\WindowsApplicationDriver_1.2.1.msi` (ignored, not committed) |
| File size | `3,932,160` bytes |
| SHA-256 | `A76A8F4E44B29BAD331ACF6B6C248FCC65324F502F28826AD2ACD5F3C80857FE` |
| Trusted comparison | Matches the SHA-256 published by the reviewed Chocolatey package script, which retrieves the official GitHub URL |
| MSI installation this follow-up | `PASS`; normal elevated `msiexec` execution, exit code `0`; installed product version `1.2.1.0` |
| Developer Mode | `AVAILABLE`; `IsValid=True`; developer license expiration `9999-12-31 08:00:00` |
| WinAppDriver.exe actual path | `C:\Program Files (x86)\Windows Application Driver\WinAppDriver.exe` |
| Direct WinAppDriver process | `PASS`; PID `15856`; started from the actual installed path and stopped after verification |
| Direct WinAppDriver HTTP | `PASS`; `GET http://127.0.0.1:4723/status` returned HTTP `200`; response build version `1.2.2009`; port listener was observed on `127.0.0.1:4723` |
| Appium Server | `PASS`; project-local Appium `3.6.0`, `/status` returned `ready=true` |
| Windows Driver | `PASS`; Appium matched project-local `windows@6.1.1` and spawned the installed WinAppDriver backend |
| `TC-AVA-E2E-ENV-001` | `PASS`; real executable launched, Appium Session created, MainWindow handle `0x00110460` obtained, Page Source retrieved |
| `TC-AVA-E2E-001` | Not executed; no approved non-sensitive parser-valid `LOGCLIENT_TEST_PACKAGE` configured |
| Remaining blocker | Only the approved parser-valid `LOGCLIENT_TEST_PACKAGE` fixture for the business Case |
| Registry/security change | None |

The MSI was obtained from the official Microsoft GitHub Release URL; no mirror or modified binary was used. Its SHA-256 matched the trusted checksum comparison recorded above. Developer Mode was enabled by the user through the normal Windows mechanism; no registry or security-policy change was made by this task. The direct backend was verified before the project Appium run. All test-owned Appium, WinAppDriver, and HZ.LogClient processes were cleaned up after evidence collection.
