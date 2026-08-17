using Avalonia.Controls;
using Avalonia.Data;
using Avalonia.Layout;

namespace AutomatedTesting.Avalonia11.RealProject.Headless;

public sealed class TestWindow : Window
{
    public TestWindow()
    {
        DataContext = new TestViewModel();

        var inputTextBox = new TextBox
        {
            Name = "InputTextBox",
            Width = 240,
        };
        inputTextBox.Bind(
            TextBox.TextProperty,
            new Binding(nameof(TestViewModel.InputText))
            {
                Mode = BindingMode.TwoWay,
            });

        var submitButton = new Button
        {
            Name = "SubmitButton",
            Content = "Submit",
        };
        submitButton.Bind(
            Button.CommandProperty,
            new Binding(nameof(TestViewModel.SubmitCommand)));

        var statusTextBlock = new TextBlock
        {
            Name = "StatusTextBlock",
        };
        statusTextBlock.Bind(
            TextBlock.TextProperty,
            new Binding(nameof(TestViewModel.StatusText)));

        Content = new StackPanel
        {
            Spacing = 8,
            Children =
            {
                inputTextBox,
                submitButton,
                statusTextBlock,
            },
        };
    }
}
