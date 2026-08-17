using System.Reflection;
using Avalonia.Controls;
using Avalonia.Headless.XUnit;
using Xunit;

namespace AutomatedTesting.Avalonia11.RealProject.Headless;

public sealed class TC_AVA_REPLAY_001_RealViewBehavior
{
    [AvaloniaFact]
    public void TC_AVA_REPLAY_001_TimeRangeState_ShouldRenderRealHeadlessControls()
    {
        using var harness = RealBusinessViewHarness.Create("HZ.LogClient.Views.ReplayView");
        var rangeStart = new DateTimeOffset(2026, 8, 17, 10, 0, 0, TimeSpan.Zero);
        var rangeEnd = rangeStart.AddSeconds(60);
        var selectedStart = rangeStart.AddSeconds(10);
        var selectedEnd = rangeStart.AddSeconds(40);

        harness.InvokePrivate("SetReplayTimeRange", rangeStart, rangeEnd, selectedStart, selectedEnd);

        var slider = harness.GetNamedControl<Control>("ReplayTimeRangeSlider");
        var rangeText = harness.GetNamedControl<TextBlock>("ReplayTimeRangeText");
        var startText = harness.GetNamedControl<TextBlock>("ReplayStartTimeText");
        var endText = harness.GetNamedControl<TextBlock>("ReplayEndTimeText");

        Assert.True((bool)slider.GetType().GetProperty("IsEnabled")!.GetValue(slider)!);
        Assert.Equal(0d, ReadDouble(slider, "Minimum"), precision: 5);
        Assert.Equal(60000d, ReadDouble(slider, "Maximum"), precision: 5);
        Assert.Equal(10000d, ReadDouble(slider, "LowerValue"), precision: 5);
        Assert.Equal(40000d, ReadDouble(slider, "UpperValue"), precision: 5);
        Assert.NotEqual("- - -", rangeText.Text);
        Assert.False(string.IsNullOrWhiteSpace(startText.Text));
        Assert.False(string.IsNullOrWhiteSpace(endText.Text));
    }

    private static double ReadDouble(Control control, string propertyName)
    {
        return Convert.ToDouble(
            control.GetType().GetProperty(propertyName, BindingFlags.Instance | BindingFlags.Public)!.GetValue(control));
    }
}
