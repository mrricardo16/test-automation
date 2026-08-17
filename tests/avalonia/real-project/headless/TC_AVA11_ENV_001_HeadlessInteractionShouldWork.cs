using Avalonia.Controls;
using Avalonia.Headless;
using Avalonia.Headless.XUnit;
using Avalonia.Input;
using Xunit;

namespace AutomatedTesting.Avalonia11.RealProject.Headless;

public sealed class TC_AVA11_ENV_001_HeadlessInteractionShouldWork
{
    [AvaloniaFact]
    public void TC_AVA11_ENV_001_HeadlessInteraction_ShouldUpdateBoundStatus()
    {
        var window = new TestWindow();
        var viewModel = Assert.IsType<TestViewModel>(window.DataContext);
        var panel = Assert.IsType<StackPanel>(window.Content);

        var textBox = Assert.IsType<TextBox>(
            panel.Children.Single(control => control.Name == "InputTextBox"));
        var button = Assert.IsType<Button>(
            panel.Children.Single(control => control.Name == "SubmitButton"));
        var statusText = Assert.IsType<TextBlock>(
            panel.Children.Single(control => control.Name == "StatusTextBlock"));

        window.Show();
        Assert.True(window.IsVisible);

        textBox.Focus();
        window.KeyTextInput("phase2c");

        Assert.Equal("phase2c", viewModel.InputText);
        Assert.Equal(string.Empty, statusText.Text);

        button.Focus();
        window.KeyReleaseQwerty(PhysicalKey.Space, RawInputModifiers.None);

        Assert.Equal("phase2c", viewModel.StatusText);
        Assert.Equal("phase2c", statusText.Text);

        window.Close();
    }
}
