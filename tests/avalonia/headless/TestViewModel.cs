using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;

namespace AutomatedTesting.Avalonia.Headless;

public sealed class TestViewModel : INotifyPropertyChanged
{
    private string _inputText = string.Empty;
    private string _statusText = string.Empty;

    public TestViewModel()
    {
        SubmitCommand = new RelayCommand(() => StatusText = InputText);
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    public string InputText
    {
        get => _inputText;
        set
        {
            if (_inputText == value)
            {
                return;
            }

            _inputText = value;
            OnPropertyChanged();
        }
    }

    public string StatusText
    {
        get => _statusText;
        private set
        {
            if (_statusText == value)
            {
                return;
            }

            _statusText = value;
            OnPropertyChanged();
        }
    }

    public ICommand SubmitCommand { get; }

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    private sealed class RelayCommand : ICommand
    {
        private readonly Action _execute;

        public RelayCommand(Action execute)
        {
            _execute = execute;
        }

        public event EventHandler? CanExecuteChanged
        {
            add { }
            remove { }
        }

        public bool CanExecute(object? parameter) => true;

        public void Execute(object? parameter) => _execute();
    }
}
