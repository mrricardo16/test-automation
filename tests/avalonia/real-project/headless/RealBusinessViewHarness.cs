using System.Reflection;
using Avalonia.Controls;
using Avalonia.VisualTree;

namespace AutomatedTesting.Avalonia11.RealProject.Headless;

internal sealed class RealBusinessViewHarness : IDisposable
{
    private RealBusinessViewHarness(Assembly businessAssembly, UserControl view, Window window)
    {
        BusinessAssembly = businessAssembly;
        View = view;
        Window = window;
    }

    public Assembly BusinessAssembly { get; }

    public UserControl View { get; }

    public Window Window { get; }

    public static RealBusinessViewHarness Create(string viewTypeName)
    {
        var configuration = AutomatedTesting.Avalonia.RealProject.Unit.LocalProjectConfiguration.Load();
        var businessAssembly = DefaultRuntimeAssemblyLoader.LoadBusinessAssembly(
            configuration.RuntimeDirectory,
            configuration.ExpectedBusinessAssembly);
        var viewType = businessAssembly.GetType(viewTypeName, throwOnError: true)!;
        var view = AssertAssignable<UserControl>(Activator.CreateInstance(viewType));
        var window = new Window { Content = view };
        window.Show();
        return new RealBusinessViewHarness(businessAssembly, view, window);
    }

    public T GetNamedControl<T>(string name)
        where T : Control
    {
        var field = View.GetType().GetField(name, BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
        if (field?.GetValue(View) is T fieldControl)
        {
            return fieldControl;
        }

        var visualControl = View.GetVisualDescendants()
            .OfType<T>()
            .FirstOrDefault(control => string.Equals(control.Name, name, StringComparison.Ordinal));
        return visualControl ?? throw new InvalidOperationException(
            $"The real view did not expose a control named '{name}' of type {typeof(T).FullName}.");
    }

    public object GetPrivateField(string fieldName)
    {
        var field = View.GetType().GetField(fieldName, BindingFlags.Instance | BindingFlags.NonPublic)
            ?? throw new MissingFieldException(View.GetType().FullName, fieldName);
        return field.GetValue(View)
            ?? throw new InvalidOperationException($"The real view field '{fieldName}' is null.");
    }

    public object? InvokePrivate(string methodName, params object?[] arguments)
    {
        var method = View.GetType().GetMethods(BindingFlags.Instance | BindingFlags.NonPublic)
            .FirstOrDefault(candidate => candidate.Name == methodName && candidate.GetParameters().Length == arguments.Length)
            ?? throw new MissingMethodException(View.GetType().FullName, methodName);
        return method.Invoke(View, arguments);
    }

    public void Dispose()
    {
        Window.Close();
    }

    private static T AssertAssignable<T>(object? value)
    {
        return value is T typed
            ? typed
            : throw new InvalidOperationException($"Expected {typeof(T).FullName}, got {value?.GetType().FullName ?? "null"}.");
    }
}
