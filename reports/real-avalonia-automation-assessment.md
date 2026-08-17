# Real Avalonia Automation Assessment Matrix

**Assessment date:** 2026-08-17
**Phase 3A update:** 2026-08-17; behavior-level real AnalysisView and ReplayView Headless coverage added without changing the source project
**Source:** `D:\HZ_RSS40\03_trunk\src_m_logclient`
**Actual project directory:** `D:\HZ_RSS40\03_trunk\src_m_logclient\logclient`
**Runtime:** `E:\logclient\logclient20260812\net8.0`

This is a read-only assessment. No source code, project file, solution file, resource, configuration, binary, or runtime file was modified.

## Classification Definitions

- `AUTO_UNIT`: pure state, model, command, validator, or service behavior that does not require an Avalonia UI session.
- `AUTO_HEADLESS`: direct Avalonia Headless verification without an external test double.
- `AUTO_HEADLESS_WITH_MOCK`: Headless verification with test-owned Fake/Mock/Stub isolation.
- `NEEDS_APPIUM`: real desktop, native window, accessibility, or OS integration behavior.
- `MANUAL`: not currently reliable as deterministic automation.
- `BLOCKED`: the current safe integration path is not available or cannot be executed under the read-only boundary.
- `PRODUCT_CHANGE_RECOMMENDED`: product seams would materially improve safe automation, but no product change is authorized here.

## Matrix

### 1. Analysis state, range, and filters

| Field | Evidence-based assessment |
|---|---|
| Module | Log analysis state and filtering |
| View | None; consumed by `AnalysisView` |
| ViewModel | None; `AnalysisQueryState` is a state class, not a ViewModel |
| PrimaryControls | Indirectly bound to result-limit, page, filter, and time-range controls |
| ExternalDependencies | None for the core state transitions |
| HeadlessSuitability | Not required; high unit-test suitability |
| RecommendedTestLayer | xUnit unit test |
| AutomationClassification | `AUTO_UNIT` |
| Risk | Low |
| Reason | `AnalysisQueryState`, `AnalysisTimeRange`, and `LogAnalysisFilter` contain deterministic local state and filtering logic. |
| RecommendedNextStep | `TC-AVA-LOG-001` now executes against the read-only runtime assembly through the independent unit Harness. |

### 2. Log package import and record session

| Field | Evidence-based assessment |
|---|---|
| Module | Log package import, JSONL indexing, and record session |
| View | `AnalysisView` import flow |
| ViewModel | None |
| PrimaryControls | Package selector, package list, import confirmation, analysis result lists |
| ExternalDependencies | ZIP files, JSON/JSONL content, file paths, and Newtonsoft.Json |
| HeadlessSuitability | UI is not required for parser behavior; UI flow needs a test-owned storage/file double |
| RecommendedTestLayer | xUnit unit tests for parser/session; optional Headless test for test-owned package data |
| AutomationClassification | `AUTO_UNIT` |
| Risk | Medium; malformed or large packages can affect runtime and memory |
| Reason | `LogPackageReader` and `ImportedLogSession` operate on test-owned ZIP/JSON fixtures and do not require a production service. |
| RecommendedNextStep | Keep all ZIP/JSON fixtures under the automation repository; never use production log packages for destructive or write-oriented tests. |

### 3. Analysis/report aggregation

| Field | Evidence-based assessment |
|---|---|
| Module | Analysis projections, task aggregation, time alignment, and HTML/JSON report building |
| View | Results rendered by `AnalysisView` |
| ViewModel | None; results are assembled in code-behind and helper services |
| PrimaryControls | Search, summary lists, pagination, export buttons |
| ExternalDependencies | In-memory `LogLineRecord` data, Newtonsoft.Json, output file path for export |
| HeadlessSuitability | High for pure transformations; export UI requires a test-owned save target |
| RecommendedTestLayer | xUnit unit tests; Headless only for state presentation |
| AutomationClassification | `AUTO_UNIT` |
| Risk | Medium; behavior is distributed between code-behind and static helpers |
| Reason | `LogReportProjection`, `TaskAnalysisContext`, `TaskExecutionAnalyzer`, `MaintenanceTaskAggregator`, and `LogAnalysisReportBuilder` expose deterministic transformations over records. |
| RecommendedNextStep | Prioritize pure projection and aggregation cases before UI cases. |

### 4. AnalysisView

| Field | Evidence-based assessment |
|---|---|
| Module | Log analysis page |
| View | `Views/AnalysisView.axaml`, `Views/AnalysisView.axaml.cs` |
| ViewModel | None; event handlers and private fields own the page state |
| PrimaryControls | TextBox, ComboBox, CheckBox, ListBox, Button, Expander, custom time-range control, loading overlay, context menus |
| ExternalDependencies | `LogClientContext`, `LogPackageReader`, file picker, save picker, ZIP/JSON, dialogs, `Process.Start`, theme resources |
| HeadlessSuitability | Medium only with test-owned storage and data doubles; current direct dependencies prevent a clean isolated page test |
| RecommendedTestLayer | Avalonia Headless with a test-owned integration harness after version alignment |
| AutomationClassification | `AUTO_HEADLESS_WITH_MOCK` |
| Risk | High; no ViewModel/DI seam, native storage provider, dialogs, direct file writes, and static parser calls |
| Reason | The control tree is present and the page can potentially be exercised with controlled fixtures, but file selection and export paths are coupled to `TopLevel.StorageProvider`. |
| RecommendedNextStep | A bounded real constructor/control-tree smoke is now covered by `TC-AVA-ANALYSIS-001`. Full import, storage, dialog, and export flows still require test-owned doubles; if those seams cannot be isolated, report `PRODUCT_CHANGE_RECOMMENDED`. |

### 5. ReplayView state and playback controls

| Field | Evidence-based assessment |
|---|---|
| Module | Log replay page and playback state |
| View | `Views/ReplayView.axaml`, `Views/ReplayView.axaml.cs` |
| ViewModel | None; playback state is stored in the view code-behind |
| PrimaryControls | ComboBox, time-range slider, CheckBox category toggles, previous/play/next buttons, Slider, status panels |
| ExternalDependencies | `LogClientContext`, log package records, map loader, time alignment, timer/playback state, dialogs |
| HeadlessSuitability | Medium for control state with test-owned data; low for full replay rendering |
| RecommendedTestLayer | Avalonia Headless with test-owned data and doubles for external selection; separate visual/manual review |
| AutomationClassification | `AUTO_HEADLESS_WITH_MOCK` |
| Risk | High; state, rendering, timers, dynamic panels, and data loading are combined in one large code-behind class |
| Reason | Playback button and slider state can be deterministic, while map and status rendering have additional data, layout, and timing dependencies. |
| RecommendedNextStep | Defer until the AnalysisView harness is proven; cover pure `LogTimeAlignmentService` and replay status selectors at unit level first. |

### 6. ReplayMapCanvas and map drawing

| Field | Evidence-based assessment |
|---|---|
| Module | Map viewport, custom drawing, vehicle/site/track rendering |
| View | `Views/ReplayMapCanvas.cs` embedded in `ReplayView` |
| ViewModel | None |
| PrimaryControls | Custom `Control`, Canvas overlays, pointer-driven pan/zoom/drag behavior |
| ExternalDependencies | Map JSON, custom drawing context, viewport size, geometry and image/text rendering |
| HeadlessSuitability | Low for visual correctness; some geometry helpers can be unit-tested |
| RecommendedTestLayer | Unit tests for geometry/rules; manual visual acceptance for rendered appearance |
| AutomationClassification | `MANUAL` |
| Risk | High; pixel/layout fidelity and custom drawing are not established by the current fixture |
| Reason | Headless can instantiate controls, but it does not establish product-level visual acceptance for the custom canvas. |
| RecommendedNextStep | Extract or test pure map-rule behavior separately; keep visual acceptance manual until a stable visual evidence strategy exists. |

### 7. App, MainWindow, theme, and window chrome

| Field | Evidence-based assessment |
|---|---|
| Module | Application startup, main window, tab switching, theme and window chrome |
| View | `App.axaml`, `App.axaml.cs`, `MainWindow.axaml`, `MainWindow.axaml.cs` |
| ViewModel | None |
| PrimaryControls | Window, custom title bar, tab buttons, image resources, window state controls, analysis/replay pages |
| ExternalDependencies | Avalonia resources, Semi.Avalonia, Ursa themes, image assets, theme persistence, desktop lifetime |
| HeadlessSuitability | The version-matched Harness now covers a bounded control-tree smoke; full shell startup remains blocked by resource, theme, and page coupling |
| RecommendedTestLayer | Version-matched Headless smoke test after isolated harness setup |
| AutomationClassification | `BLOCKED` |
| Risk | High; direct assembly integration can cause version conflicts and a source-project build can write `bin/obj` into the read-only project |
| Reason | `TC-AVA11-ENV-001` proves the independent 11.3.14 Harness. `App` still loads XAML and theme resources, while `MainWindow` immediately constructs both pages, loads an icon, applies persisted theme state, and wires desktop window behavior. |
| RecommendedNextStep | Keep the independent Harness and runtime-DLL path. Do not add a ProjectReference; evaluate full App/MainWindow only after resource loading and side-effect boundaries are separately controlled. |

### 8. Native file, dialog, export, and OS window behavior

| Field | Evidence-based assessment |
|---|---|
| Module | File picker, save picker, modal dialogs, exported report opening, drag/fullscreen/minimize/maximize/close |
| View | AnalysisView, ReplayView, MainWindow, AbnormalContextWindow |
| ViewModel | None |
| PrimaryControls | Native storage provider, Window dialogs, title-bar buttons, pointer drag and F11 handling |
| ExternalDependencies | Windows desktop session, file picker, shell execution, native window manager |
| HeadlessSuitability | Low; Headless has no real native storage or desktop window manager |
| RecommendedTestLayer | Real desktop E2E only where UI Automation is required; otherwise manual |
| AutomationClassification | `NEEDS_APPIUM` |
| Risk | High; can open dialogs or external processes and can affect user-visible desktop state |
| Reason | These behaviors depend on real OS integration and are explicitly outside the current Headless-only baseline. |
| RecommendedNextStep | Do not install Appium in this phase; define a small, separately approved Appium scope later. |

### 9. Product testability seams

| Field | Evidence-based assessment |
|---|---|
| Module | View/ViewModel/service boundary |
| View | AnalysisView and ReplayView |
| ViewModel | No dedicated ViewModel layer found in the source tree |
| PrimaryControls | Event-handler-driven controls and code-created dynamic controls |
| ExternalDependencies | Static services, context object, file picker, dialogs, theme persistence, file system |
| HeadlessSuitability | Can improve materially with product-side seams, but changes are not allowed in this task |
| RecommendedTestLayer | Future Headless with injected doubles |
| AutomationClassification | `PRODUCT_CHANGE_RECOMMENDED` |
| Risk | High; test code cannot replace direct static calls or constructor-coupled dependencies cleanly |
| Reason | The project already has `InternalsVisibleTo` for `HZ.LogClient.Tests`, but no test project was found and no interface-based service injection/ViewModel seam was found. |
| RecommendedNextStep | Recommend, without implementing: introduce injectable abstractions for package/file services and move page state/commands into ViewModels; add AutomationId only where future Appium requires stable identification. |

## Classification Counts

Counts are matrix-row counts, not executable test counts:

| Classification | Count |
|---|---:|
| `AUTO_UNIT` | 3 |
| `AUTO_HEADLESS` | 1 |
| `AUTO_HEADLESS_WITH_MOCK` | 2 |
| `NEEDS_APPIUM` | 1 |
| `MANUAL` | 1 |
| `BLOCKED` | 1 |
| `PRODUCT_CHANGE_RECOMMENDED` | 1 |

## Phase 2C Executed Coverage

| TestCaseId | Executed scope | Classification | Status |
|---|---|---|---|
| `TC-AVA11-ENV-001` | Independent Avalonia 11.3.14 Window/Control Tree/Binding/Command/Headless input baseline | `AUTO_HEADLESS` | `PASS` |
| `TC-AVA-LOG-001` | Real `AnalysisQueryState` from read-only `HZ.LogClient.dll` | `AUTO_UNIT` | `PASS` |
| `TC-AVA-ANALYSIS-001` | Real `AnalysisView` constructor and representative control tree | `AUTO_HEADLESS` | `PASS` |

The full AnalysisView row remains `AUTO_HEADLESS_WITH_MOCK` because import, storage provider, dialogs, and export are coupled to external side effects. The bounded constructor/control-tree smoke must not be interpreted as full page workflow coverage.

## Phase 3A behavior-level matrix

The rows below refine the broad module rows above. Classification is applied by behavior, not by page name. `AUTO_UNIT` takes priority over Headless when no Avalonia session is needed; Headless takes priority over Appium when control state is observable without native desktop integration.

### AnalysisView

| Behavior | Evidence from real source | TestCase / layer | Classification | Phase 3A result | Boundary |
| --- | --- | --- | --- | --- | --- |
| Constructor and representative control tree | `AnalysisView` initializes real AXAML controls and event wiring | `TC-AVA-ANALYSIS-001` / Headless | `AUTO_HEADLESS` | PASS | Smoke only; no session data |
| Task-code filter input invalidates the query snapshot | `GenericTextFilter_Changed` calls the real `InvalidateQuerySnapshot` path | `TC-AVA-ANALYSIS-002` / Headless | `AUTO_HEADLESS` | PASS | No package/session required |
| Result-limit action updates the query state and visible label | `ResultLimit_Click` calls real `_queryState.TrySetResultLimit` and updates `ResultLimitText` | `TC-AVA-ANALYSIS-003` / Headless | `AUTO_HEADLESS` | PASS | Snapshot setup uses reflection on the real runtime object; no fake state object |
| Result-limit/page arithmetic | `AnalysisQueryState` is deterministic state logic | `TC-AVA-LOG-001` / unit | `AUTO_UNIT` | PASS | No UI required |
| JSONL/package parsing and projections | `LogPackageReader`, `LogReportProjection`, aggregation and alignment services operate on records | Future unit / test-owned fixture | `AUTO_UNIT` | Candidate | Synthetic fixture schema must be confirmed; no sensitive production package copied |
| Full query execution and result rendering | `QueryRowsAsync` directly calls `context.Session.QueryAnalysisRecords` and uses code-behind state | Future Headless + test double | `AUTO_HEADLESS_WITH_MOCK` | Boundary assessed | Current context/session seam is not injectable from the external Harness |
| Import, save export, and report opening | Direct `TopLevel.StorageProvider`, `File.WriteAllTextAsync`, and `Process.Start` calls | Appium candidate / manual file contract | `NEEDS_APPIUM` | Deferred | Requires real native picker/shell or an approved product seam |

### ReplayView

| Behavior | Evidence from real source | TestCase / layer | Classification | Phase 3A result | Boundary |
| --- | --- | --- | --- | --- | --- |
| Constructor and empty replay control tree | Real `ReplayView` initializes timer, custom slider, map canvas, and status controls | Phase 3A harness | `AUTO_HEADLESS` | PASS as part of `TC-AVA-REPLAY-001` | No map or package loaded |
| Selected time range updates slider and labels | Real private `SetReplayTimeRange` updates `AnalysisTimeRange`, slider bounds, enabled state, and labels | `TC-AVA-REPLAY-001` / Headless | `AUTO_HEADLESS` | PASS | Reflection invokes the real method; pixel output is not asserted |
| Replay status classification and timing rules | `ReplayStatusSelector`, `ReplayStatusClassifier`, and `ReplayPlaybackTiming` are deterministic | Future unit | `AUTO_UNIT` | Candidate | Prefer unit coverage before page integration |
| Package/frame loading and playback state | `RefreshReplay` directly uses `LogClientContext`, session records, package frames, map loading, and a DispatcherTimer | Future Headless + test double | `AUTO_HEADLESS_WITH_MOCK` | Boundary assessed | Test-owned session/package seam is not currently exposed |
| Native map selection | Direct `TopLevel.StorageProvider.OpenFilePickerAsync` | Appium candidate | `NEEDS_APPIUM` | Deferred | Requires OS picker |
| Canvas geometry/pixels and visual status panels | `ReplayMapCanvas` custom drawing and pointer/layout behavior | Manual visual evidence; unit rules separately | `MANUAL` | Deferred | Headless state does not prove pixel fidelity |

## Phase 3A test doubles and unmockable dependencies

No Mock, Fake, Stub, or copied product object was introduced. The test-only reflection adapter only loads the compiled DLL and invokes real view members for setup/observation. The following direct dependencies remain unmockable from the current external Harness: `TopLevel.StorageProvider`, `File.WriteAllTextAsync`, `Process.Start`, `LogClientContext.Session`, `ImportedLogSession.QueryAnalysisRecords`, `ImportedLogSession.BuildReplayFrames`, map loading, and the view-owned `DispatcherTimer`. They remain `AUTO_HEADLESS_WITH_MOCK` boundary candidates or `PRODUCT_CHANGE_RECOMMENDED`; the test repository does not alter the product to create seams.

## Phase 3A AutomationId assessment

The source scan found no `AutomationProperties.AutomationId` or `AutomationProperties.Name` in `MainWindow.axaml`, `AnalysisView.axaml`, or `ReplayView.axaml`. Existing `x:Name` values provide useful Headless/reflection handles but are not a stable cross-process Appium locator contract. Product-side AutomationId additions are therefore `PRODUCT_CHANGE_RECOMMENDED` for the small future Appium scope; no AXAML or product code was modified.

## Phase 3A executed coverage

| TestCaseId | Executed scope | Classification | Status |
|---|---|---|---|
| `TC-AVA-ANALYSIS-002` | Real TaskCodeFilter input invalidates real query state and clears real result/pagination controls | `AUTO_HEADLESS` | `PASS` |
| `TC-AVA-ANALYSIS-003` | Real result-limit event updates real query state and visible label | `AUTO_HEADLESS` | `PASS` |
| `TC-AVA-REPLAY-001` | Real ReplayView time-range state updates real slider and labels | `AUTO_HEADLESS` | `PASS` |

These three cases are behavior-level coverage, not full import, export, replay-data, native-window, or visual-map acceptance.
