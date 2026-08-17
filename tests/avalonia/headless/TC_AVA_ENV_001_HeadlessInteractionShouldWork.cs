using Avalonia.Controls;
using Avalonia.Headless;
using Avalonia.Headless.XUnit;
using Avalonia.Input;
using Xunit;

namespace AutomatedTesting.Avalonia.Headless;

public sealed class TC_AVA_ENV_001_HeadlessInteractionShouldWork
{
    [AvaloniaFact]
    public void TC_AVA_ENV_001_HeadlessInteraction_ShouldUpdateBoundStatus()
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
        window.KeyTextInput("hello");

        Assert.Equal("hello", viewModel.InputText);
        Assert.Equal(string.Empty, statusText.Text);

        button.Focus();
        window.KeyReleaseQwerty(PhysicalKey.Space, RawInputModifiers.None);

        Assert.Equal("hello", viewModel.StatusText);
        Assert.Equal("hello", statusText.Text);

        window.Close();
    }
}
