using System.Reflection;
using System.Runtime.Loader;

namespace AutomatedTesting.Avalonia11.RealProject.Headless;

internal static class DefaultRuntimeAssemblyLoader
{
    public static Assembly LoadBusinessAssembly(string runtimeDirectory, string assemblyName)
    {
        var assemblyPath = Path.Combine(runtimeDirectory, assemblyName);
        if (!File.Exists(assemblyPath))
        {
            throw new FileNotFoundException(
                $"The configured read-only runtime assembly was not found: {assemblyPath}",
                assemblyPath);
        }

        AssemblyLoadContext.Default.Resolving += (_, requestedAssembly) =>
        {
            var alreadyLoaded = AssemblyLoadContext.Default.Assemblies
                .FirstOrDefault(assembly => assembly.GetName().Name == requestedAssembly.Name);
            if (alreadyLoaded is not null)
            {
                return alreadyLoaded;
            }

            var dependencyPath = Path.Combine(runtimeDirectory, $"{requestedAssembly.Name}.dll");
            return File.Exists(dependencyPath)
                ? AssemblyLoadContext.Default.LoadFromAssemblyPath(dependencyPath)
                : null;
        };

        return AssemblyLoadContext.Default.LoadFromAssemblyPath(assemblyPath);
    }
}
