using System.Collections;
using System.Reflection;
using Avalonia.Controls;
using Avalonia.Headless.XUnit;
using Avalonia.Interactivity;
using Xunit;

namespace AutomatedTesting.Avalonia11.RealProject.Headless;

public sealed class TC_AVA_ANALYSIS_002_003_RealViewBehavior
{
    [AvaloniaFact]
    public void TC_AVA_ANALYSIS_002_FilterInput_ShouldInvalidateRealQuerySnapshotAndClearResults()
    {
        using var harness = RealBusinessViewHarness.Create("HZ.LogClient.Views.AnalysisView");
        var filter = harness.GetNamedControl<TextBox>("TaskCodeFilter");
        var rows = harness.GetNamedControl<ListBox>("AnalysisRowsList");
        var pagination = harness.GetNamedControl<Border>("PaginationBorder");

        filter.Text = "TASK-001";

        var queryState = harness.GetPrivateField("_queryState");
        var isSnapshotCurrent = (bool)queryState.GetType()
            .GetProperty("IsSnapshotCurrent", BindingFlags.Instance | BindingFlags.Public)!
            .GetValue(queryState)!;

        Assert.False(isSnapshotCurrent);
        Assert.Empty(rows.ItemsSource?.Cast<object>() ?? Enumerable.Empty<object>());
        Assert.False(pagination.IsVisible);
    }

    [AvaloniaFact]
    public void TC_AVA_ANALYSIS_003_ResultLimitAction_ShouldUpdateRealQueryStateAndText()
    {
        using var harness = RealBusinessViewHarness.Create("HZ.LogClient.Views.AnalysisView");
        var queryState = harness.GetPrivateField("_queryState");
        var markCompleted = queryState.GetType().GetMethod(
            "MarkQueryCompleted",
            BindingFlags.Instance | BindingFlags.Public,
            binder: null,
            types: new[] { typeof(int), typeof(int), typeof(int) },
            modifiers: null)!;
        markCompleted.Invoke(queryState, new object[] { 3, 1, 3 });

        harness.InvokePrivate(
            "ResultLimit_Click",
            new Button { Tag = "3000" },
            new RoutedEventArgs());

        var resultLimit = (int)queryState.GetType().GetProperty("ResultLimit")!.GetValue(queryState)!;
        var resultLimitText = harness.GetNamedControl<TextBlock>("ResultLimitText");

        Assert.Equal(3000, resultLimit);
        Assert.Contains("3k", resultLimitText.Text, StringComparison.OrdinalIgnoreCase);
    }
}
