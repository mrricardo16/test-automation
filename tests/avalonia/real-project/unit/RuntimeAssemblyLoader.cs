using System.Reflection;
using System.Runtime.Loader;

namespace AutomatedTesting.Avalonia.RealProject.Unit;

internal sealed class RuntimeAssemblyLoader : AssemblyLoadContext
{
    private readonly AssemblyDependencyResolver _resolver;

    private RuntimeAssemblyLoader(string assemblyPath)
        : base($"RealLogClient-{Guid.NewGuid():N}", isCollectible: true)
    {
        _resolver = new AssemblyDependencyResolver(assemblyPath);
    }

    public static Assembly LoadBusinessAssembly(string runtimeDirectory, string assemblyName)
    {
        var assemblyPath = Path.Combine(runtimeDirectory, assemblyName);
        if (!File.Exists(assemblyPath))
        {
            throw new FileNotFoundException(
                $"The configured read-only runtime assembly was not found: {assemblyPath}",
                assemblyPath);
        }

        var loadContext = new RuntimeAssemblyLoader(assemblyPath);
        return loadContext.LoadFromAssemblyPath(assemblyPath);
    }

    protected override Assembly? Load(AssemblyName assemblyName)
    {
        var resolvedPath = _resolver.ResolveAssemblyToPath(assemblyName);
        return resolvedPath is null ? null : LoadFromAssemblyPath(resolvedPath);
    }
}
