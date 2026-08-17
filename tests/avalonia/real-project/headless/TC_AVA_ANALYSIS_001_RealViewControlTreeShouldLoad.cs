using Avalonia.Controls;
using Avalonia.Headless;
using Avalonia.Headless.XUnit;
using Avalonia.VisualTree;
using Xunit;

namespace AutomatedTesting.Avalonia11.RealProject.Headless;

public sealed class TC_AVA_ANALYSIS_001_RealViewControlTreeShouldLoad
{
    [AvaloniaFact]
    public void TC_AVA_ANALYSIS_001_AnalysisView_ShouldLoadRealControlTreeWithoutExternalSideEffects()
    {
        var configuration = AutomatedTesting.Avalonia.RealProject.Unit.LocalProjectConfiguration.Load();
        var businessAssembly = DefaultRuntimeAssemblyLoader.LoadBusinessAssembly(
            configuration.RuntimeDirectory,
            configuration.ExpectedBusinessAssembly);
        var viewType = businessAssembly.GetType("HZ.LogClient.Views.AnalysisView", throwOnError: true)!;
        var view = Assert.IsAssignableFrom<UserControl>(Activator.CreateInstance(viewType));
        var window = new Window { Content = view };

        window.Show();

        var descendants = view.GetVisualDescendants().ToList();
        Assert.Contains(descendants, control => control is TextBox);
        Assert.Contains(descendants, control => control is Button);
        Assert.Contains(descendants, control => control is ListBox);

        window.Close();
    }
}
