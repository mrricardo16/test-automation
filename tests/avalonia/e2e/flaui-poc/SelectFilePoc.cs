using System.Diagnostics;
using System.Drawing;
using System.Text.Json;
using FlaUI.Core.AutomationElements;
using FlaUI.Core.Definitions;
using FlaUI.UIA3;

internal static class SelectFilePoc
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public static int Run(string[] args)
    {
        var options = ParseOptions(args);
        Directory.CreateDirectory(options.EvidenceDirectory);
        var result = CreateResult(options);

        try
        {
            var process = Process.GetProcessById(options.ProcessId);
            if (!string.Equals(process.ProcessName, "HZ.LogClient", StringComparison.OrdinalIgnoreCase))
            {
                throw new SelectFileFailure("ERROR_PROCESS_MISMATCH", $"PID={options.ProcessId}; Process={process.ProcessName}");
            }

            using var automation = new UIA3Automation();
            _ = FlaUI.Core.Application.Attach(process);
            var mainWindow = WaitFor(() => FindMainWindow(automation, options.ProcessId), TimeSpan.FromSeconds(10), "MainWindow");
            var analysisPage = mainWindow.FindFirstDescendant(cf => cf.ByAutomationId("AnalysisPage"));
            var logFileTextBox = mainWindow.FindFirstDescendant(cf => cf.ByAutomationId("LogFileTextBox"));
            result["MainWindow"] = Describe(mainWindow);
            result["AnalysisPageFound"] = analysisPage is not null;
            result["LogFileTextBoxFound"] = logFileTextBox is not null;
            result["LogFileTextBoxValueBefore"] = ReadText(logFileTextBox);

            if (analysisPage is null || logFileTextBox is null)
            {
                throw new SelectFileFailure("ERROR_AUTOMATION", "AnalysisPage or LogFileTextBox was not found.");
            }

            var dialog = FindDialog(automation, options.ProcessId, options.DialogHwnd);
            if (dialog is null && !string.Equals(options.AppiumClickStatus, "DIALOG_OPEN", StringComparison.OrdinalIgnoreCase))
            {
                var entryButton = FindFileNameEntryButton(logFileTextBox);
                result["EntryButton"] = entryButton is null ? null : Describe(entryButton);
                if (entryButton is null)
                {
                    throw new SelectFileFailure("ERROR_DIALOG_ENTRY", "FileName sibling button was not found.");
                }

                entryButton.Click(moveMouse: false);
                result["FileDialogEntry"] = "FlaUI element.Click(moveMouse:false)";
            }
            else
            {
                result["FileDialogEntry"] = "Appium click";
            }

            var dialogLookupStart = Stopwatch.GetTimestamp();
            try
            {
                dialog = WaitFor(() => FindDialog(automation, options.ProcessId, options.DialogHwnd), TimeSpan.FromSeconds(10), "#32770 File Dialog");
            }
            catch (InvalidOperationException error)
            {
                throw new SelectFileFailure("ERROR_DIALOG_ENTRY", error.Message);
            }
            result["DialogLookupDurationMs"] = ElapsedMilliseconds(dialogLookupStart);
            result["Dialog"] = Describe(dialog);
            Capture(dialog, Path.Combine(options.EvidenceDirectory, "dialog-before-input.png"));
            WriteJson(options.EvidenceDirectory, "dialog-tree.json", new { dialog = Describe(dialog), elements = dialog.FindAllDescendants().Select(Describe).ToArray() });

            var fileNameLookupStart = Stopwatch.GetTimestamp();
            var fileNameEditor = FindFileNameEditor(dialog);
            result["FileNameEditorLookupDurationMs"] = ElapsedMilliseconds(fileNameLookupStart);
            if (fileNameEditor is null)
            {
                throw new SelectFileFailure("ERROR_FILENAME_EDIT_NOT_FOUND", "FileName Edit was not found in #32770.");
            }

            var fileNameInfo = Describe(fileNameEditor);
            result["FileNameEditor"] = fileNameInfo;
            WriteJson(options.EvidenceDirectory, "filename-editor.json", fileNameInfo);
            var fileNameTextBox = fileNameEditor.AsTextBox();
            result["FileNameValueBefore"] = fileNameTextBox.Text;
            result["FileNameValuePatternSupported"] = fileNameEditor.Patterns.Value.IsSupported;

            fileNameEditor.Focus();
            fileNameEditor.Click(moveMouse: false);
            result["FileNameEditorActivation"] = "fileNameEditor.Focus(); fileNameEditor.Click(moveMouse:false)";
            WriteJson(options.EvidenceDirectory, "filename-focused.json", new
            {
                editor = Describe(fileNameEditor),
                activation = result["FileNameEditorActivation"]
            });
            Capture(dialog, Path.Combine(options.EvidenceDirectory, "filename-focused.png"));

            var inputStart = Stopwatch.GetTimestamp();
            fileNameTextBox.Text = options.FilePath;
            result["FileNameInputDurationMs"] = ElapsedMilliseconds(inputStart);
            result["FileNameEditorAssignment"] = "fileNameEditor.AsTextBox().Text = filePath";
            result["FileNameValueAfter"] = fileNameTextBox.Text;
            WriteJson(options.EvidenceDirectory, "filename-after-input.json", new
            {
                expected = options.FilePath,
                actual = result["FileNameValueAfter"],
                exact = string.Equals((string?)result["FileNameValueAfter"], options.FilePath, StringComparison.Ordinal)
            });
            Capture(dialog, Path.Combine(options.EvidenceDirectory, "after-input.png"));
            if (result["FileNameValueAfter"] is not string valueAfter || !string.Equals(valueAfter, options.FilePath, StringComparison.Ordinal))
            {
                throw new SelectFileFailure("VALUE_WRITE_UNVERIFIED", "FileName Edit did not expose the exact absolute path after assignment.");
            }

            var openButtonLookupStart = Stopwatch.GetTimestamp();
            var openButton = FindOpenButton(dialog);
            result["OpenButtonLookupDurationMs"] = ElapsedMilliseconds(openButtonLookupStart);
            if (openButton is null)
            {
                throw new SelectFileFailure("ERROR_OPEN_BUTTON_NOT_FOUND", "Open Button was not found.");
            }

            result["OpenButton"] = Describe(openButton);
            WriteJson(options.EvidenceDirectory, "open-button.json", Describe(openButton));
            var openStart = Stopwatch.GetTimestamp();
            openButton.Click(moveMouse: false);
            result["OpenClick"] = "openButton.Click(moveMouse:false)";
            var dialogClosed = WaitForDialogClosed(automation, options.ProcessId, options.DialogHwnd, TimeSpan.FromSeconds(10));
            result["DialogClosed"] = dialogClosed;
            result["DialogCloseDurationMs"] = ElapsedMilliseconds(openStart);
            if (!dialogClosed)
            {
                Capture(dialog, Path.Combine(options.EvidenceDirectory, "after-open.png"));
                throw new SelectFileFailure("ERROR_FILE_DIALOG_NOT_CLOSED", "File Dialog did not close after Open.");
            }

            var analysisAfter = WaitFor(() => FindMainWindow(automation, options.ProcessId), TimeSpan.FromSeconds(10), "AnalysisPage after select");
            var logFileAfter = analysisAfter.FindFirstDescendant(cf => cf.ByAutomationId("LogFileTextBox"));
            result["AnalysisPageReturned"] = analysisAfter.FindFirstDescendant(cf => cf.ByAutomationId("AnalysisPage")) is not null;
            result["LogFileTextBoxValueAfter"] = ReadText(logFileAfter);
            result["ProductFeedback"] = CaptureProductFeedback(analysisAfter);
            result["ProductFeedbackDurationMs"] = 0L;
            WriteJson(options.EvidenceDirectory, "analysis-after-select.xml", new { value = result["LogFileTextBoxValueAfter"], feedback = result["ProductFeedback"] });
            Capture(analysisAfter, Path.Combine(options.EvidenceDirectory, "analysis-after-select.png"));
            if (!(bool)result["AnalysisPageReturned"]!)
            {
                throw new SelectFileFailure("FAIL_PRODUCT_FILE_NOT_RECEIVED", "AnalysisPage was not available after Dialog close.");
            }

            var productValue = result["LogFileTextBoxValueAfter"] as string;
            if (string.IsNullOrWhiteSpace(productValue) || string.Equals(productValue, result["LogFileTextBoxValueBefore"] as string, StringComparison.Ordinal))
            {
                throw new SelectFileFailure("FAIL_PRODUCT_FILE_NOT_RECEIVED", "Analysis LogFileTextBox did not show an observable change after selection.");
            }

            result["ProductFileReceived"] = true;
            result["AbsoluteSingleFilePathViaFileNameEdit"] = "PASS";
            result["DirectoryNavigationRequired"] = false;
            result["Status"] = "PASS";
        }
        catch (SelectFileFailure failure)
        {
            result["Status"] = failure.Code;
            result["Failure"] = failure.Message;
        }
        catch (Exception error)
        {
            result["Status"] = "ERROR_AUTOMATION";
            result["Failure"] = error.ToString();
        }
        finally
        {
            result["FinishedAt"] = DateTimeOffset.UtcNow;
            WriteJson(options.EvidenceDirectory, "poc4-result.json", result);
            Console.WriteLine(JsonSerializer.Serialize(result, JsonOptions));
        }

        return string.Equals((string?)result["Status"], "PASS", StringComparison.Ordinal) ? 0 : 1;
    }

    private static Dictionary<string, object?> CreateResult(Options options) => new()
    {
        ["PocId"] = "POC-FLAUI-SELECTFILE-001",
        ["StartedAt"] = DateTimeOffset.UtcNow,
        ["FilePath"] = options.FilePath,
        ["AppiumClickStatus"] = options.AppiumClickStatus,
        ["FileDialogEntry"] = null,
        ["Dialog"] = null,
        ["FileNameEditor"] = null,
        ["FileNameValueBefore"] = null,
        ["FileNameValueAfter"] = null,
        ["OpenButton"] = null,
        ["DialogClosed"] = false,
        ["AnalysisPageReturned"] = false,
        ["LogFileTextBoxValueBefore"] = null,
        ["LogFileTextBoxValueAfter"] = null,
        ["ProductFeedback"] = null,
        ["ProductFileReceived"] = false,
        ["AbsoluteSingleFilePathViaFileNameEdit"] = "NOT_REACHED",
        ["DirectoryNavigationRequired"] = false,
        ["Status"] = "ERROR_AUTOMATION",
        ["ProhibitedMethods"] = new Dictionary<string, bool>
        {
            ["AddressBar"] = false, ["CtrlL"] = false, ["AltD"] = false, ["Clipboard"] = false,
            ["WinAppDriverKeys"] = false, ["W3CActions"] = false, ["FixedCoordinates"] = false,
            ["KeyboardHack"] = false, ["MultiFilePathInput"] = false
        }
    };

    private static AutomationElement FindMainWindow(UIA3Automation automation, int processId) =>
        automation.GetDesktop().FindFirstChild(cf => cf.ByProcessId(processId).And(cf.ByControlType(ControlType.Window)))
        ?? throw new InvalidOperationException($"MainWindow for PID {processId} was not found.");

    private static AutomationElement? FindDialog(UIA3Automation automation, int processId, long? dialogHwnd)
    {
        if (dialogHwnd is long hwnd)
        {
            try
            {
                var element = automation.FromHandle((IntPtr)hwnd);
                if (element is not null
                    && string.Equals(SafeString(() => element.ClassName), "#32770", StringComparison.Ordinal)
                    && (element.Properties.ProcessId.ValueOrDefault == processId || IsFileDialogTitle(SafeString(() => element.Name))))
                {
                    return element;
                }
            }
            catch
            {
                // The native handle can disappear while the dialog is closing.
            }
        }

        return automation.GetDesktop().FindAllChildren(cf => cf.ByClassName("#32770"))
            .FirstOrDefault(element =>
                element.Properties.ProcessId.ValueOrDefault == processId || IsFileDialogTitle(SafeString(() => element.Name)));
    }

    private static bool IsFileDialogTitle(string title) =>
        title.Contains("选择", StringComparison.OrdinalIgnoreCase)
        || title.Contains("打开", StringComparison.OrdinalIgnoreCase)
        || title.Contains("open", StringComparison.OrdinalIgnoreCase)
        || title.Contains("select", StringComparison.OrdinalIgnoreCase);

    private static AutomationElement? FindFileNameEntryButton(AutomationElement edit)
    {
        var parent = edit.Parent;
        return (parent?.FindAllDescendants(cf => cf.ByControlType(ControlType.Button)) ?? [])
            .FirstOrDefault(button => string.Equals(SafeString(() => button.Name), "选择", StringComparison.Ordinal) && !button.IsOffscreen);
    }

    private static AutomationElement? FindFileNameEditor(AutomationElement dialog)
    {
        var edits = dialog.FindAllDescendants(cf => cf.ByControlType(ControlType.Edit));
        return edits
            .Where(edit => !edit.IsOffscreen && !string.Equals(SafeString(() => edit.AutomationId), "SearchEditBox", StringComparison.OrdinalIgnoreCase))
            .Select(edit => new { edit, score = FileNameScore(edit) })
            .Where(item => item.score > 0)
            .OrderByDescending(item => item.score)
            .Select(item => item.edit)
            .FirstOrDefault();
    }

    private static int FileNameScore(AutomationElement edit)
    {
        var score = 0;
        var automationId = SafeString(() => edit.AutomationId);
        var name = SafeString(() => edit.Name);
        if (string.Equals(automationId, "1148", StringComparison.OrdinalIgnoreCase)) score += 5;
        if (name.Contains("文件名", StringComparison.OrdinalIgnoreCase) || name.Contains("file name", StringComparison.OrdinalIgnoreCase)) score += 6;
        if (string.Equals(SafeString(() => edit.ClassName), "Edit", StringComparison.OrdinalIgnoreCase)) score++;
        if (edit.Patterns.Value.IsSupported) score += 2;
        return score;
    }

    private static AutomationElement? FindOpenButton(AutomationElement dialog)
    {
        var buttons = dialog.FindAllDescendants(cf => cf.ByControlType(ControlType.Button));
        return buttons.FirstOrDefault(button => string.Equals(SafeString(() => button.AutomationId), "1", StringComparison.Ordinal) && button.IsEnabled)
            ?? buttons.FirstOrDefault(button => (SafeString(() => button.Name).Contains("打开", StringComparison.OrdinalIgnoreCase) || SafeString(() => button.Name).Contains("open", StringComparison.OrdinalIgnoreCase)) && button.IsEnabled);
    }

    private static bool WaitForDialogClosed(UIA3Automation automation, int processId, long? dialogHwnd, TimeSpan timeout)
    {
        var deadline = DateTime.UtcNow + timeout;
        while (DateTime.UtcNow < deadline)
        {
            if (FindDialog(automation, processId, dialogHwnd) is null) return true;
            Thread.Sleep(250);
        }
        return FindDialog(automation, processId, dialogHwnd) is null;
    }

    private static AutomationElement WaitFor(Func<AutomationElement?> factory, TimeSpan timeout, string description)
    {
        var deadline = DateTime.UtcNow + timeout;
        Exception? last = null;
        while (DateTime.UtcNow < deadline)
        {
            try
            {
                var element = factory();
                if (element is not null) return element;
            }
            catch (Exception error) { last = error; }
            Thread.Sleep(250);
        }
        throw new InvalidOperationException($"{description} timeout: {last?.Message}");
    }

    private static string? ReadText(AutomationElement? element)
    {
        if (element is null) return null;
        try { return element.AsTextBox().Text; } catch { return null; }
    }

    private static Dictionary<string, object?> Describe(AutomationElement element) => new()
    {
        ["AutomationId"] = SafeString(() => element.AutomationId),
        ["Name"] = SafeString(() => element.Name),
        ["ClassName"] = SafeString(() => element.ClassName),
        ["ControlType"] = element.ControlType.ToString(),
        ["IsEnabled"] = Safe(() => element.IsEnabled),
        ["IsOffscreen"] = Safe(() => element.IsOffscreen),
        ["NativeWindowHandle"] = Safe(() => element.Properties.NativeWindowHandle.ValueOrDefault.ToInt64()),
        ["ProcessId"] = Safe(() => element.Properties.ProcessId.ValueOrDefault),
        ["FrameworkType"] = SafeString(() => element.FrameworkType.ToString()),
        ["BoundingRectangle"] = SafeString(() => element.BoundingRectangle.ToString()),
        ["ValuePatternSupported"] = element.Patterns.Value.IsSupported,
        ["LegacyIAccessibleSupported"] = element.Patterns.LegacyIAccessible.IsSupported,
        ["CurrentValue"] = ReadText(element)
    };

    private static Dictionary<string, object?> CaptureProductFeedback(AutomationElement mainWindow) => new()
    {
        ["CurrentPackageSummaryText"] = ReadText(mainWindow.FindFirstDescendant(cf => cf.ByAutomationId("CurrentPackageSummaryText"))),
        ["AnalysisCountText"] = ReadText(mainWindow.FindFirstDescendant(cf => cf.ByAutomationId("AnalysisCountText"))),
        ["ValidRecordSummaryText"] = ReadText(mainWindow.FindFirstDescendant(cf => cf.ByAutomationId("ValidRecordSummaryText")))
    };

    private static void Capture(AutomationElement element, string path)
    {
        var rectangle = element.BoundingRectangle;
        if (rectangle.Width <= 0 || rectangle.Height <= 0) return;
        using var bitmap = new Bitmap(rectangle.Width, rectangle.Height);
        using var graphics = Graphics.FromImage(bitmap);
        graphics.CopyFromScreen(rectangle.Location, Point.Empty, rectangle.Size);
        bitmap.Save(path, System.Drawing.Imaging.ImageFormat.Png);
    }

    private static Dictionary<string, string> ParseArguments(string[] args)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (var index = 0; index < args.Length; index++)
        {
            if (string.Equals(args[index], "--select-file", StringComparison.Ordinal)) continue;
            if (args[index].StartsWith("--", StringComparison.Ordinal) && index + 1 < args.Length && !args[index + 1].StartsWith("--", StringComparison.Ordinal))
            {
                values[args[index][2..]] = args[++index];
            }
        }
        return values;
    }

    private static Options ParseOptions(string[] args)
    {
        var values = ParseArguments(args);
        if (!int.TryParse(values.GetValueOrDefault("pid"), out var pid)) throw new ArgumentException("--pid is required.");
        return new Options(
            pid,
            values.GetValueOrDefault("evidence-dir") ?? Path.Combine("projects", "test-workflow", "artifacts", "phase3b-flaui-selectfile-poc"),
            values.GetValueOrDefault("file-path") ?? throw new ArgumentException("--file-path is required."),
            long.TryParse(values.GetValueOrDefault("dialog-hwnd"), out var dialogHwnd) ? dialogHwnd : null,
            values.GetValueOrDefault("appium-click-status") ?? "UNKNOWN");
    }

    private static void WriteJson(string directory, string fileName, object value) =>
        File.WriteAllText(Path.Combine(directory, fileName), JsonSerializer.Serialize(value, JsonOptions));

    private static T Safe<T>(Func<T> getter, T fallback = default!)
    {
        try { return getter(); } catch { return fallback; }
    }

    private static string SafeString(Func<string> getter) => Safe(getter, string.Empty);
    private static long ElapsedMilliseconds(long start) => (long)Stopwatch.GetElapsedTime(start).TotalMilliseconds;

    private sealed record Options(int ProcessId, string EvidenceDirectory, string FilePath, long? DialogHwnd, string AppiumClickStatus);
    private sealed class SelectFileFailure(string code, string message) : Exception(message) { public string Code { get; } = code; }
}
