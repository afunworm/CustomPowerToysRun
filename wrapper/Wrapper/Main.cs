using Wox.Plugin;
using System.IO;
using System.Diagnostics;

namespace PowerToysRunPlugin
{
    public class Main : IPlugin
    {
        public static string PluginID => "73CDD8F1B7844D2DB94BAED5980C510B";

        public string Name => "Custom PowerToys Run";

        public string Description => "Execute custom PowerToys Run commands";

        private string pluginDirectory;
        public void Init(PluginInitContext context)
        {
            // Store the plugin directory path
            pluginDirectory = context.CurrentPluginMetadata.PluginDirectory;
        }

        public List<Result> Query(Query query)
        {
            var exePath = Path.Combine(pluginDirectory, "processor.exe");
            var result = new Result
            {
                Title = $"{query.RawQuery}",
                SubTitle = $"Run Custom PowerToys Run Command",
                Action = _ =>
                {

                    try
                    {
                        var startInfo = new ProcessStartInfo
                        {
                            FileName = exePath,
                            Arguments = query.RawQuery,
                            CreateNoWindow = true,
                            UseShellExecute = false,
                            WindowStyle = ProcessWindowStyle.Hidden
                        };

                        Process.Start(startInfo);
                    }
                    catch (Exception ex)
                    {
                        // Handle exceptions as needed
                        Console.WriteLine($"Failed to start process: {ex.Message}");
                    }
                    return true;
                }
            };

            return new List<Result> { result };
        }
    }
}