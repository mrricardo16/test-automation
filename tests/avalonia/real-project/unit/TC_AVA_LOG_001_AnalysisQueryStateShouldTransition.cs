using System.Reflection;
using Xunit;

namespace AutomatedTesting.Avalonia.RealProject.Unit;

public sealed class TC_AVA_LOG_001_AnalysisQueryStateShouldTransition
{
    [Fact]
    public void TC_AVA_LOG_001_AnalysisQueryState_ShouldManageLimitsPaginationAndInvalidation()
    {
        var configuration = LocalProjectConfiguration.Load();
        Assert.Equal("net8.0", configuration.ExpectedTargetFramework);
        Assert.Equal("11.3.14", configuration.ExpectedAvaloniaVersion);

        var businessAssembly = RuntimeAssemblyLoader.LoadBusinessAssembly(
            configuration.RuntimeDirectory,
            configuration.ExpectedBusinessAssembly);
        Assert.Equal("HZ.LogClient", businessAssembly.GetName().Name);

        var queryStateType = businessAssembly.GetType(
            "HZ.LogClient.Models.AnalysisQueryState",
            throwOnError: true)!;
        var queryState = Activator.CreateInstance(queryStateType, nonPublic: true)!;

        Assert.Equal(1000, Read<int>(queryState, "ResultLimit"));
        Assert.False(Invoke<bool>(queryState, "TrySetResultLimit", 1500));
        Assert.Equal(1000, Read<int>(queryState, "ResultLimit"));
        Assert.True(Invoke<bool>(queryState, "TrySetResultLimit", 2000));
        Assert.Equal(2000, Read<int>(queryState, "ResultLimit"));

        var markQueryCompleted = queryStateType
            .GetMethods(BindingFlags.Instance | BindingFlags.Public)
            .Single(method => method.Name == "MarkQueryCompleted"
                && method.GetParameters().Length == 3);
        markQueryCompleted.Invoke(queryState, new object[] { 12000, 7, 12000 });

        Assert.True(Read<bool>(queryState, "IsSnapshotCurrent"));
        Assert.Equal(12000, Read<int>(queryState, "ValidRecordCount"));
        Assert.Equal("7", Read<string>(queryState, "AbnormalCountText"));
        Assert.Equal(6, Read<int>(queryState, "TotalPages"));
        Assert.Equal(1, Read<int>(queryState, "CurrentPage"));

        Assert.True(Invoke<bool>(queryState, "TryGoToPage", 4));
        Assert.Equal(4, Read<int>(queryState, "CurrentPage"));
        Assert.Equal(6000, Read<int>(queryState, "PageStartIndex"));
        Assert.False(Invoke<bool>(queryState, "TryGoToPage", 7));

        var compactPageNumbers = (IReadOnlyList<int?>)queryStateType
            .GetMethod("GetCompactPageNumbers")!
            .Invoke(queryState, null)!;
        Assert.Equal(new int?[] { 1, null, 4, null, 6 }, compactPageNumbers);

        queryStateType.GetMethod("Invalidate")!.Invoke(queryState, null);
        Assert.False(Read<bool>(queryState, "IsSnapshotCurrent"));
        Assert.Equal(0, Read<int>(queryState, "ValidRecordCount"));
        Assert.Equal(0, Read<int>(queryState, "TotalRecords"));
        Assert.Equal(1, Read<int>(queryState, "CurrentPage"));
    }

    private static T Read<T>(object instance, string propertyName)
    {
        return (T)instance.GetType().GetProperty(propertyName)!.GetValue(instance)!;
    }

    private static T Invoke<T>(object instance, string methodName, params object[] arguments)
    {
        return (T)instance.GetType().GetMethod(methodName)!.Invoke(instance, arguments)!;
    }
}
