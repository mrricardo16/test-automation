using Avalonia;
using Avalonia.Headless;
using Avalonia.Headless.XUnit;
using Avalonia.Themes.Fluent;

namespace AutomatedTesting.Avalonia.Headless;

public sealed class App : Application
{
    public override void Initialize()
    {
        Styles.Add(new FluentTheme());
    }
}

public static class TestAppBuilder
{
    public static global::Avalonia.AppBuilder BuildAvaloniaApp()
    {
        return global::Avalonia.AppBuilder.Configure<App>()
            .UseHeadless(new AvaloniaHeadlessPlatformOptions());
    }
}
