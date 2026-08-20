# Appium E2E Candidate List

**Phase:** 3A assessment only
**Status:** Candidate scope recorded; Appium is not installed.
**Product source:** `D:\HZ_RSS40\03_trunk\src_m_logclient` (read-only)

| Candidate | Scenario | Why Headless is insufficient | Expected evidence | Locator risk |
| --- | --- | --- | --- | --- |
| `TC-AVA-E2E-001` | Choose a real log package through the Windows file picker, confirm the package is visible, and start the analysis flow | `AnalysisView` directly calls `TopLevel.StorageProvider.OpenFilePickerAsync` and depends on a real desktop picker | Native picker opens, approved non-sensitive fixture is selected, package summary and analysis state appear | No AutomationId found; product-side stable IDs recommended |
| `TC-AVA-E2E-002` | Export the combined analysis report through the save picker and verify the saved file | `AnalysisView` directly calls save picker, `File.WriteAllTextAsync`, and shell open behavior | Native save dialog, file exists at approved target, report content is readable | No AutomationId; avoid shell-open assertion unless explicitly scoped |
| `TC-AVA-E2E-003` | Start the real desktop shell, switch to ReplayView, select a map, and validate window/map interaction | Native window lifecycle, file picker, custom Canvas interaction, and visual pixels are outside Headless | Window/tab/map selection evidence plus manual visual review; pixel assertions remain MANUAL | No AutomationId; map/canvas requires separate visual evidence |

## Next-stage minimum

After explicit approval, install/configure Appium only for `TC-AVA-E2E-001` first, using a synthetic or approved non-sensitive fixture. Add stable AutomationIds in the product only if the product team approves that change; this report does not authorize it.
