using Avalonia.Headless.XUnit;
using Xunit;

namespace AutomatedTesting.Avalonia11.RealProject.Headless;

public sealed class RealBusinessViewHarnessTests
{
    [AvaloniaFact]
    public void PlannedHarnessApi_ShouldCreateARealAnalysisView()
    {
        using var harness = RealBusinessViewHarness.Create("HZ.LogClient.Views.AnalysisView");

        Assert.Equal("AnalysisView", harness.View.GetType().Name);
    }
}
