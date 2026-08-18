using System.Diagnostics;
using System.Drawing;
using System.Text.Json;
using FlaUI.Core;
using FlaUI.Core.AutomationElements;
using FlaUI.Core.Definitions;
using FlaUI.Core.Patterns;
using FlaUI.UIA3;

internal static class Program
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };
    private static readonly string[] TargetFiles =
    [
        "hz.carlog_20260717160532098_20260717162532098.zip",
        "hz.carlog_20260717162532098_20260717164532098.zip",
        "hz.carlog_20260717164532098_20260717170532098.zip"
    ];

    private static int Main(string[] args)
    {
        if (args.Contains("--select-file", StringComparer.Ordinal))
        {
            return SelectFilePoc.Run(args);
        }

        var options = ParseArguments(args);
        Directory.CreateDirectory(options.EvidenceDirectory);
        var result = new Dictionary<string, object?>
        {
            ["pocId"] = "POC-FLAUI-FILEDIALOG-001",
            ["startedAt"] = DateTimeOffset.UtcNow,
            ["flaUiCoreVersion"] = "5.0.0",
            ["flaUiUia3Version"] = "5.0.0",
            ["nuGetSource"] = "https://api.nuget.org/v3/index.json",
            ["requestedPid"] = options.ProcessId,
            ["targetDirectory"] = options.TargetDirectory,
            ["targetFiles"] = TargetFiles,
            ["appiumClickStatus"] = options.AppiumClickStatus,
            ["entryMethod"] = "NOT_RECORDED",
            ["status"] = "ERROR_FLAUI",
            ["steps"] = new List<object?>(),
            ["prohibitedMethods"] = new Dictionary<string, bool>
            {
                ["fixedCoordinates"] = false,
                ["ctrlL"] = false,
                ["w3cActions"] = false,
                ["winAppDriverKeys"] = false,
                ["clipboard"] = false,
                ["fullPathListInFileName"] = false,
                ["chineseBreadcrumb"] = false
            }
        };
        var steps = (List<object?>)result["steps"]!;
        var timings = new Dictionary<string, long>();

        try
        {
            var process = Process.GetProcessById(options.ProcessId);
            if (!string.Equals(process.ProcessName, "HZ.LogClient", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"ERROR_PROCESS_MISMATCH: PID {options.ProcessId} is {process.ProcessName}, not HZ.LogClient.");
            }

            using var automation = new UIA3Automation();
            var application = FlaUI.Core.Application.Attach(process);
            var mainWindow = WaitFor(() => FindMainWindow(automation, options.ProcessId), 30_000, "MainWindow");
            var mainInfo = Describe(mainWindow);
            result["mainWindow"] = mainInfo;
            result["attachPidMatches"] = mainInfo.ProcessId == options.ProcessId;
            AddStep(steps, "FlaUI attach same HZ.LogClient PID", mainInfo.ProcessId == options.ProcessId ? "PASS" : "ERROR_PROCESS_MISMATCH", $"PID={mainInfo.ProcessId}");
            AddStep(steps, "MainWindow found", "PASS", $"HWND={mainInfo.NativeWindowHandle}; Title={mainInfo.Name}");

            var analysisPage = mainWindow.FindFirstDescendant(cf => cf.ByAutomationId("AnalysisPage"));
            result["analysisFound"] = analysisPage is not null;
            AddStep(steps, "Analysis page found", analysisPage is not null ? "PASS" : "ERROR_FLAUI", analysisPage is null ? "AnalysisPage not found" : Describe(analysisPage).ToString());
            if (analysisPage is null)
            {
                throw new InvalidOperationException("ERROR_FLAUI: AnalysisPage not found.");
            }

            var appiumClickFailed = string.Equals(options.AppiumClickStatus, "HTTP_500", StringComparison.OrdinalIgnoreCase)
                || string.Equals(options.AppiumClickStatus, "NO_DIALOG", StringComparison.OrdinalIgnoreCase)
                || string.Equals(options.AppiumClickStatus, "ERROR", StringComparison.OrdinalIgnoreCase);
            if (appiumClickFailed)
            {
                var fileEdit = mainWindow.FindFirstDescendant(cf => cf.ByAutomationId("LogFileTextBox"));
                var invokeButton = FindFileDialogEntryButton(fileEdit);
                result["entryButton"] = invokeButton is null ? null : Describe(invokeButton);
                if (invokeButton is null)
                {
                    throw new InvalidOperationException("ERROR_DIALOG_ENTRY: FlaUI could not locate the FileName sibling button.");
                }

                var invoke = invokeButton.Patterns.Invoke;
                if (!invoke.IsSupported)
                {
                    throw new InvalidOperationException("ERROR_DIALOG_ENTRY: FileName sibling button does not expose InvokePattern.");
                }

                invoke.Pattern.Invoke();
                result["entryMethod"] = "FlaUI UIA3 InvokePattern.Invoke";
                AddStep(steps, "FlaUI Invoke File Dialog entry", "PASS", "InvokePattern.Invoke");
            }
            else
            {
                result["entryMethod"] = "Appium click";
                AddStep(steps, "Use Appium-opened File Dialog", "PASS", "Appium click did not return HTTP 500");
            }

            var dialogLookupStart = Stopwatch.GetTimestamp();
            var dialog = WaitFor(() => FindDialog(automation, options.ProcessId) ?? throw new InvalidOperationException("dialog not found"), 30_000, "#32770 File Dialog");
            timings["DialogLookupDurationMs"] = ElapsedMilliseconds(dialogLookupStart);
            var dialogInfo = Describe(dialog);
            result["dialog"] = dialogInfo;
            AddStep(steps, "#32770 Dialog found", "PASS", $"HWND={dialogInfo.NativeWindowHandle}; PID={dialogInfo.ProcessId}; Title={dialogInfo.Name}");

            var treeLookupStart = Stopwatch.GetTimestamp();
            var allElements = dialog.FindAllDescendants();
            timings["DialogEnumerationDurationMs"] = ElapsedMilliseconds(treeLookupStart);
            var describedElements = allElements.Select(Describe).ToArray();
            WriteJson(options.EvidenceDirectory, "flaui-dialog-tree.json", new { dialog = dialogInfo, durationMs = timings["DialogEnumerationDurationMs"], elements = describedElements });
            WriteJson(options.EvidenceDirectory, "flaui-dialog-edits.json", describedElements.Where(x => x.ControlType == nameof(ControlType.Edit)).ToArray());
            WriteJson(options.EvidenceDirectory, "flaui-dialog-buttons.json", describedElements.Where(x => x.ControlType == nameof(ControlType.Button)).ToArray());
            WriteJson(options.EvidenceDirectory, "flaui-dialog-listitems.json", describedElements.Where(x => x.ControlType is nameof(ControlType.List) or nameof(ControlType.ListItem)).ToArray());
            WriteJson(options.EvidenceDirectory, "flaui-dialog-patterns.json", describedElements.Select(x => new { x.Selector, x.Name, x.ControlType, x.Patterns }).ToArray());
            Capture(dialog, Path.Combine(options.EvidenceDirectory, "before-navigation.png"));
            result["counts"] = new
            {
                Edit = describedElements.Count(x => x.ControlType == nameof(ControlType.Edit)),
                Button = describedElements.Count(x => x.ControlType == nameof(ControlType.Button)),
                List = describedElements.Count(x => x.ControlType == nameof(ControlType.List)),
                ListItem = describedElements.Count(x => x.ControlType == nameof(ControlType.ListItem))
            };
            AddStep(steps, "Scoped UIA3 dialog enumeration", "PASS", $"Elements={describedElements.Length}; DurationMs={timings["DialogEnumerationDurationMs"]}");

            var fileNameLookupStart = Stopwatch.GetTimestamp();
            var fileNameEdit = FindFileNameEdit(dialog);
            timings["FileNameLookupDurationMs"] = ElapsedMilliseconds(fileNameLookupStart);
            result["fileNameEdit"] = fileNameEdit is null ? null : Describe(fileNameEdit);
            if (fileNameEdit is null)
            {
                throw new InvalidOperationException("ERROR_FLAUI: FileName Edit could not be identified in #32770.");
            }

            var valuePattern = fileNameEdit.Patterns.Value;
            result["fileNameValuePatternSupported"] = valuePattern.IsSupported;
            result["fileNameValueBefore"] = valuePattern.IsSupported ? valuePattern.Pattern.Value : null;
            AddStep(steps, "FileName Edit / ValuePattern", valuePattern.IsSupported ? "PASS" : "ERROR_UIA3", $"Selector={Describe(fileNameEdit).Selector}; AutomationId={fileNameEdit.AutomationId}; Value={result["fileNameValueBefore"]}");
            if (!valuePattern.IsSupported)
            {
                throw new InvalidOperationException("ERROR_UIA3: FileName Edit does not support ValuePattern.");
            }

            valuePattern.Pattern.SetValue(options.TargetDirectory);
            var valueAfter = valuePattern.Pattern.Value;
            result["fileNameValueAfter"] = valueAfter;
            if (!string.Equals(valueAfter, options.TargetDirectory, StringComparison.Ordinal))
            {
                throw new InvalidOperationException($"FAIL_DIRECTORY_NAVIGATION: FileName value was '{valueAfter}', expected '{options.TargetDirectory}'.");
            }

            var openButton = FindOpenButton(dialog);
            result["openButton"] = openButton is null ? null : Describe(openButton);
            if (openButton is null || !openButton.Patterns.Invoke.IsSupported)
            {
                throw new InvalidOperationException("ERROR_UIA3: Open button or InvokePattern not available.");
            }

            openButton.Patterns.Invoke.Pattern.Invoke();
            AddStep(steps, "Invoke Open for directory navigation", "PASS", $"Selector={Describe(openButton).Selector}");
            Thread.Sleep(2_000);
            var dialogAfter = FindDialog(automation, options.ProcessId);
            result["dialogAfterOpenExists"] = dialogAfter is not null;
            if (dialogAfter is null)
            {
                throw new InvalidOperationException("ERROR_DIALOG_BEHAVIOR: Dialog closed after directory Open; directory navigation not proven.");
            }

            var listLookupStart = Stopwatch.GetTimestamp();
            var listItems = dialogAfter.FindAllDescendants(cf => cf.ByControlType(ControlType.ListItem));
            timings["FileListEnumerationDurationMs"] = ElapsedMilliseconds(listLookupStart);
            var listRecords = listItems.Select(Describe).ToArray();
            Capture(dialogAfter, Path.Combine(options.EvidenceDirectory, "target-directory.png"));
            WriteJson(options.EvidenceDirectory, "target-directory-files.json", listRecords);
            result["listItems"] = listRecords;
            result["targetFilesFound"] = TargetFiles.Select(name => listRecords.FirstOrDefault(x => string.Equals(x.Name, name, StringComparison.Ordinal))).ToArray();
            var missingFiles = TargetFiles.Where(name => !listRecords.Any(x => string.Equals(x.Name, name, StringComparison.Ordinal))).ToArray();
            if (missingFiles.Length != 0)
            {
                throw new InvalidOperationException($"FAIL_DIRECTORY_NAVIGATION: Missing target file list items: {string.Join(", ", missingFiles)}");
            }

            var selected = new List<object?>();
            var targetElements = TargetFiles.Select(name => listItems.First(x => string.Equals(x.Name, name, StringComparison.Ordinal))).ToArray();
            var selectionStart = Stopwatch.GetTimestamp();
            var selectionSupported = targetElements.All(x => x.Patterns.SelectionItem.IsSupported);
            result["selectionItemPatternSupported"] = targetElements.Select(x => x.Patterns.SelectionItem.IsSupported).ToArray();
            if (!selectionSupported)
            {
                throw new InvalidOperationException("PARTIAL_PASS_DIRECTORY_NAVIGATION: one or more target ZIPs do not expose SelectionItemPattern.");
            }

            targetElements[0].Patterns.SelectionItem.Pattern.Select();
            targetElements[1].Patterns.SelectionItem.Pattern.AddToSelection();
            targetElements[2].Patterns.SelectionItem.Pattern.AddToSelection();
            timings["SelectionDurationMs"] = ElapsedMilliseconds(selectionStart);
            foreach (var element in targetElements)
            {
                selected.Add(new
                {
                    element = Describe(element),
                    isSelected = element.Patterns.SelectionItem.Pattern.IsSelected,
                    selectionItemPatternSupported = element.Patterns.SelectionItem.IsSupported,
                    invokePatternSupported = element.Patterns.Invoke.IsSupported,
                    legacyIAccessibleSupported = element.Patterns.LegacyIAccessible.IsSupported
                });
            }

            var listContainer = listItems.FirstOrDefault()?.Parent;
            object? selectionContainer = null;
            if (listContainer is not null && listContainer.Patterns.Selection.IsSupported)
            {
                var selection = listContainer.Patterns.Selection.Pattern;
                var listBox = new FlaUI.Core.AutomationElements.ListBox(listContainer.FrameworkAutomationElement);
                selectionContainer = new
                {
                    selector = Describe(listContainer).Selector,
                    selectionPatternSupported = true,
                    canSelectMultiple = selection.CanSelectMultiple,
                    isSelectionRequired = selection.IsSelectionRequired,
                    selectedItemsCount = listBox.SelectedItems.Length
                };
            }

            result["selection"] = selected;
            result["selectionContainer"] = selectionContainer;
            WriteJson(options.EvidenceDirectory, "selection-state.json", new { selected, selectionContainer });
            Capture(dialogAfter, Path.Combine(options.EvidenceDirectory, "three-files-selected.png"));
            if (selected.Any(x => x is null))
            {
                throw new InvalidOperationException("FAIL_MULTISELECT: selection state was not recorded.");
            }

            var selectedFlags = selected.Select(x => (bool?)x?.GetType().GetProperty("isSelected")?.GetValue(x)).ToArray();
            if (selectedFlags.Any(x => x != true))
            {
                throw new InvalidOperationException($"FAIL_MULTISELECT: IsSelected flags = {JsonSerializer.Serialize(selectedFlags)}");
            }

            result["status"] = "PASS";
            AddStep(steps, "Three target ZIPs selected", "PASS", "Select + AddToSelection + IsSelected=true for all three");
        }
        catch (Exception error)
        {
            result["status"] = Classify(error.Message);
            if (string.Equals((string?)result["entryMethod"], "FlaUI UIA3 InvokePattern.Invoke", StringComparison.Ordinal)
                && string.Equals((string?)result["status"], "ERROR_DIALOG_DISCOVERY", StringComparison.Ordinal))
            {
                result["status"] = "ERROR_DIALOG_ENTRY";
            }
            result["error"] = error.ToString();
            AddStep(steps, "Stop at first non-recoverable result", (string)result["status"]!, error.Message);
        }
        finally
        {
            result["timingsMs"] = timings;
            result["finishedAt"] = DateTimeOffset.UtcNow;
            WriteJson(options.EvidenceDirectory, "flaui-poc-result.json", result);
            Console.WriteLine(JsonSerializer.Serialize(result, JsonOptions));
        }

        return string.Equals((string?)result["status"], "PASS", StringComparison.Ordinal) ? 0 : 1;
    }

    private static string Classify(string message)
    {
        if (message.StartsWith("ERROR_PROCESS_MISMATCH", StringComparison.Ordinal)) return "ERROR_PROCESS_MISMATCH";
        if (message.StartsWith("ERROR_DIALOG_ENTRY", StringComparison.Ordinal)) return "ERROR_DIALOG_ENTRY";
        if (message.StartsWith("ERROR_UIA3", StringComparison.Ordinal)) return "ERROR_UIA3";
        if (message.StartsWith("ERROR_DIALOG_BEHAVIOR", StringComparison.Ordinal)) return "ERROR_DIALOG_BEHAVIOR";
        if (message.StartsWith("FAIL_MULTISELECT", StringComparison.Ordinal)) return "FAIL_MULTISELECT";
        if (message.StartsWith("FAIL_DIRECTORY_NAVIGATION", StringComparison.Ordinal)) return "FAIL_DIRECTORY_NAVIGATION";
        if (message.StartsWith("PARTIAL_PASS_DIRECTORY_NAVIGATION", StringComparison.Ordinal)) return "PARTIAL_PASS_DIRECTORY_NAVIGATION";
        if (message.Contains("#32770 File Dialog", StringComparison.Ordinal)) return "ERROR_DIALOG_DISCOVERY";
        return "ERROR_FLAUI";
    }

    private static AutomationElement FindMainWindow(UIA3Automation automation, int processId) =>
        automation.GetDesktop().FindFirstChild(cf => cf.ByProcessId(processId).And(cf.ByControlType(ControlType.Window)))
        ?? throw new InvalidOperationException($"MainWindow for PID {processId} not found.");

    private static AutomationElement? FindDialog(UIA3Automation automation, int processId)
    {
        return automation.GetDesktop().FindAllChildren(cf => cf.ByControlType(ControlType.Window))
            .FirstOrDefault(x => x.Properties.ProcessId.ValueOrDefault == processId && string.Equals(x.ClassName, "#32770", StringComparison.Ordinal));
    }

    private static AutomationElement? FindFileDialogEntryButton(AutomationElement? edit)
    {
        if (edit is null) return null;
        var parent = edit.Parent;
        var candidates = parent?.FindAllDescendants(cf => cf.ByControlType(ControlType.Button)) ?? [];
        return candidates.FirstOrDefault(x => string.Equals(SafeString(() => x.Name), "选择", StringComparison.Ordinal) && !x.IsOffscreen)
            ?? candidates.FirstOrDefault(x => !x.IsOffscreen && x.Patterns.Invoke.IsSupported);
    }

    private static AutomationElement? FindFileNameEdit(AutomationElement dialog)
    {
        var edits = dialog.FindAllDescendants(cf => cf.ByControlType(ControlType.Edit));
        return edits
            .Where(x => !x.IsOffscreen && !string.Equals(SafeString(() => x.AutomationId), "SearchEditBox", StringComparison.OrdinalIgnoreCase))
            .Select(x => new { Element = x, Score = FileNameScore(x) })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .Select(x => x.Element)
            .FirstOrDefault();
    }

    private static int FileNameScore(AutomationElement element)
    {
        var score = 0;
        if (string.Equals(SafeString(() => element.AutomationId), "1148", StringComparison.OrdinalIgnoreCase)) score += 4;
        var name = SafeString(() => element.Name);
        if (name.Contains("文件名", StringComparison.OrdinalIgnoreCase) || name.Contains("file name", StringComparison.OrdinalIgnoreCase)) score += 6;
        if (SafeString(() => element.ClassName).Equals("Edit", StringComparison.OrdinalIgnoreCase)) score++;
        if (element.Patterns.Value.IsSupported) score += 2;
        return score;
    }

    private static AutomationElement? FindOpenButton(AutomationElement dialog)
    {
        var buttons = dialog.FindAllDescendants(cf => cf.ByControlType(ControlType.Button));
        return buttons.FirstOrDefault(x => string.Equals(SafeString(() => x.AutomationId), "1", StringComparison.Ordinal) && !x.IsOffscreen)
            ?? buttons.FirstOrDefault(x => (SafeString(() => x.Name).Contains("打开", StringComparison.OrdinalIgnoreCase) || SafeString(() => x.Name).Contains("open", StringComparison.OrdinalIgnoreCase)) && !x.IsOffscreen);
    }

    private static AutomationElement WaitFor(Func<AutomationElement> factory, int timeoutMs, string description)
    {
        var deadline = Stopwatch.GetTimestamp() + Stopwatch.Frequency * timeoutMs / 1000;
        Exception? last = null;
        while (Stopwatch.GetTimestamp() < deadline)
        {
            try { return factory(); } catch (Exception error) { last = error; }
            Thread.Sleep(250);
        }

        throw new InvalidOperationException($"{description} timeout: {last?.Message}");
    }

    private static ElementInfo Describe(AutomationElement element)
    {
        var patterns = new Dictionary<string, bool>
        {
            ["Value"] = element.Patterns.Value.IsSupported,
            ["Invoke"] = element.Patterns.Invoke.IsSupported,
            ["Selection"] = element.Patterns.Selection.IsSupported,
            ["SelectionItem"] = element.Patterns.SelectionItem.IsSupported,
            ["ExpandCollapse"] = element.Patterns.ExpandCollapse.IsSupported,
            ["LegacyIAccessible"] = element.Patterns.LegacyIAccessible.IsSupported
        };
        return new ElementInfo(
            Selector(element),
            SafeString(() => element.AutomationId),
            SafeString(() => element.Name),
            SafeString(() => element.ClassName),
            element.ControlType.ToString(),
            Safe(() => element.IsEnabled),
            Safe(() => element.IsOffscreen),
            Safe(() => element.Properties.NativeWindowHandle.ValueOrDefault.ToInt64()),
            Safe(() => element.Properties.ProcessId.ValueOrDefault),
            SafeString(() => element.FrameworkType.ToString()),
            SafeString(() => element.BoundingRectangle.ToString()),
            patterns,
            element.Patterns.Value.IsSupported ? element.Patterns.Value.Pattern.Value : null);
    }

    private static string Selector(AutomationElement element) =>
        !string.IsNullOrWhiteSpace(SafeString(() => element.AutomationId)) ? $"automationId:{SafeString(() => element.AutomationId)}" : $"name:{SafeString(() => element.Name)};type:{element.ControlType}";

    private static T Safe<T>(Func<T> getter, T fallback = default!)
    {
        try { return getter(); } catch { return fallback; }
    }

    private static string SafeString(Func<string> getter) => Safe(getter, string.Empty);

    private static void Capture(AutomationElement element, string path)
    {
        var rect = element.BoundingRectangle;
        if (rect.Width <= 0 || rect.Height <= 0) return;
        using var bitmap = new Bitmap(rect.Width, rect.Height);
        using var graphics = Graphics.FromImage(bitmap);
        graphics.CopyFromScreen(rect.Location, Point.Empty, rect.Size);
        bitmap.Save(path, System.Drawing.Imaging.ImageFormat.Png);
    }

    private static long ElapsedMilliseconds(long start) => (long)(Stopwatch.GetElapsedTime(start).TotalMilliseconds);

    private static void AddStep(List<object?> steps, string name, string status, string details) =>
        steps.Add(new { name, status, details, at = DateTimeOffset.UtcNow });

    private static void WriteJson(string directory, string fileName, object value) =>
        File.WriteAllText(Path.Combine(directory, fileName), JsonSerializer.Serialize(value, JsonOptions));

    private static Options ParseArguments(string[] args)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < args.Length; i++)
        {
            if (!args[i].StartsWith("--", StringComparison.Ordinal) || i + 1 >= args.Length) continue;
            values[args[i][2..]] = args[++i];
        }

        if (!int.TryParse(values.GetValueOrDefault("pid"), out var pid)) throw new ArgumentException("--pid is required.");
        return new Options(
            pid,
            values.GetValueOrDefault("evidence-dir") ?? Path.Combine("artifacts", "phase3b-flaui-poc"),
            values.GetValueOrDefault("target-directory") ?? throw new ArgumentException("--target-directory is required."),
            values.GetValueOrDefault("appium-click-status") ?? "UNKNOWN");
    }

    private sealed record Options(int ProcessId, string EvidenceDirectory, string TargetDirectory, string AppiumClickStatus);

    private sealed record ElementInfo(
        string Selector,
        string AutomationId,
        string Name,
        string ClassName,
        string ControlType,
        bool IsEnabled,
        bool IsOffscreen,
        long NativeWindowHandle,
        int ProcessId,
        string FrameworkType,
        string BoundingRectangle,
        Dictionary<string, bool> Patterns,
        string? Value);
}
