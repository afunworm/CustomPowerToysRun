using Wox.Plugin;
using System.IO;
using System.Diagnostics;
using Wox.Plugin.Common.Win32;

namespace PowerToysRunPlugin
{
    public class Main : IPlugin
    {
        public static string PluginID => "73CDD8F1B7844D2DB94BAED5980C510B";

        public string Name => "Custom PowerToys Run";

        public string Description => "Execute custom PowerToys Run commands";

        private string pluginDirectory;
        private List<(string command, string description)> commandList = new();
        public void Init(PluginInitContext context)
        {
            // Store the plugin directory path
            pluginDirectory = context.CurrentPluginMetadata.PluginDirectory;

            // Load commands from the commands.txt file
            var commandsFilePath = Path.Combine(pluginDirectory, "commands.txt");
            if (File.Exists(commandsFilePath))
            {
                var lines = File.ReadAllLines(commandsFilePath);
                foreach (var line in lines)
                {
                    // Ignore empty lines and comments
                    if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith("#"))
                        continue;

                    // Split the line into fields
                    var parts = line.Split('|');
                    if (parts.Length >= 5)
                    {
                        // Extract commands and description
                        var commands = parts[0].Split(',').Select(c => c.Trim().ToLowerInvariant());
                        var description = parts[4].Trim();

                        // Add each command to the list
                        foreach (var command in commands)
                        {
                            commandList.Add((command, description));
                        }
                    }
                }
            }
        }

        public List<Result> Query(Query query)
        {
            // Get main processor.exe path
            var exePath = Path.Combine(pluginDirectory, "processor.exe");

            // Get userInput
            string userInput = query.RawQuery.TrimStart(':').ToLowerInvariant();
            var results = new List<Result>();

            // Prioritize commands that start with the input
            var startsWithMatches = commandList
                .Where(cmd => cmd.command.StartsWith(userInput))
                .ToList();

            // Include commands that contain the input but do not start with it
            var containsMatches = commandList
                .Where(cmd => !cmd.command.StartsWith(userInput) && cmd.command.Contains(userInput))
                .ToList();

            // Filter commands that start with the user input
            var matchingCommands = startsWithMatches.Concat(containsMatches);

            // Add the default command, only if there's no exact match from the commandList
            bool exactMatch = commandList.Any(cmd => cmd.command == userInput);
            if (!exactMatch)
            {
                results.Add(new Result
                {
                    Title = $"{query.RawQuery.TrimStart(':')}",
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
                });
            }

            // Additional suggestion for matching commands
            foreach (var (command, description) in matchingCommands)
            {
                results.Add(new Result
                {
                    Title = $"{command}",
                    SubTitle = description,
                    Action = _ =>
                    {
                        try
                        {
                            var startInfo = new ProcessStartInfo
                            {
                                FileName = exePath,
                                Arguments = command,
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
                });
            }

            return results;
        }
    }
}