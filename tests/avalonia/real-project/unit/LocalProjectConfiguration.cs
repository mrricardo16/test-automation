using System.Text.Json;

namespace AutomatedTesting.Avalonia.RealProject.Unit;

public sealed record LocalProjectConfiguration(
    string RealProjectSourceRoot,
    string RealProjectDirectory,
    string RuntimeDirectory,
    string ExpectedTargetFramework,
    string ExpectedAvaloniaVersion,
    string ExpectedBusinessAssembly)
{
    public static LocalProjectConfiguration Load()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            var configDirectory = Path.Combine(directory.FullName, "config");
            var localPath = Path.Combine(configDirectory, "local-projects.json");
            var examplePath = Path.Combine(configDirectory, "local-projects.example.json");
            var selectedPath = File.Exists(localPath) ? localPath : examplePath;

            if (File.Exists(selectedPath))
            {
                var json = File.ReadAllText(selectedPath);
                var configuration = JsonSerializer.Deserialize<LocalProjectConfiguration>(
                    json,
                    new JsonSerializerOptions(JsonSerializerDefaults.Web));

                return configuration ?? throw new InvalidOperationException(
                    $"Local project configuration is empty: {selectedPath}");
            }

            directory = directory.Parent;
        }

        throw new FileNotFoundException(
            "Neither config/local-projects.json nor config/local-projects.example.json was found.");
    }
}
