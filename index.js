/**
 * Import libraries
 */
const argv = require("process").argv;
const Helper = require("./functions.js");
const helper = new Helper();

const actions = {
	cmd: require("./actions/cmd.js"),
	open: require("./actions/open.js"),
	shell: require("./actions/shell.js"),
};

/**
 * Checking for input
 * Replace PowerToys Run's Direct Activation Command with ""
 */
const input = argv.slice(2).join(" ").replace(":", "").trim();
if (!input) {
	console.log("User input required.");
	process.exit();
}

/**
 * Main process
 */
(async () => {
	/**
	 * Manually determine the plugin folder as PowerToys Run actually runs from
	 * a parent folder instead (AppData/Local/Microsoft/PowerToys instead of
	 * AppData/Local/Microsoft/PowerToys/PowerToys Run/Plugins/)
	 */
	// This is Windows, so there's no need to detect extra OS
	const pluginDir = helper.getPluginDir();
	const commandFile = `${pluginDir}\\commands.txt`;
	const commandFileExists = await helper.fileExists(commandFile);

	if (!commandFileExists) {
		await helper.log("Creating default commands.txt file...");
		await helper.writeFile(
			commandFile,
			`###########################################################################################################################
# Any line starts with # will be ignored. This can be used to comment your configuration.
# Commands are separated by line. The command's configurations are separated by | with the following format:
#
#                        command | action | targets/script | parameter passing | description
#
# command
#         The name of the command. For example, if your command is demo, you can invoke it using :demo in PowerToys Run
#
# action
#         What action to take when the command is invoked. There are 3 supported actions at the moment:
#             1. open: Open the target. Target could be a website URL, a schema, or an application path.
#             2. shell: Run script using powershell. For example, you can run 'node /path/to/my/script.js', or any
#                       arbitrary script such as 'Write-Host "This is a test"'
#             3. cmd: Same as shell, but run in the command prompt environment instead.
# 
# target/script
#         1. If action is open, this refers to the targets to open. Targets can be an application path or web URL or any schemas
#            that can be opened. Multiple targets can be separated by commas
#         2. If the action is shell or cmd, this refers to the script.
#         Note: Since this configuration file is | separated, replace all | characters from your script with %pipe% and
#               it will be parsed into | upon execution.
#
# description
#         Description of your command. Will be shown in the notification when the command is invoked.
#
############################################################################################################################

default | open | https://google.com/search?q= | 1 | Search Google
demo | shell | Add-Type -AssemblyName System.Windows.Forms %pipe% Out-Null; [System.Windows.Forms.MessageBox]::Show("This dialog was generated through a powershell command associated with the command :demo. Isn't this cool?",'Demo','OK','Question') | 0 | Run demo shell command
config | open | ${commandFile} | 0 | Open Custom PowerToys Run configuration file
facebook,fb | open | https://facebook.com/ | 0 | Open Facebook in the default browser
twitter,x | open | https://x.com/ | 0 | Open X in the default browser
yt,youtube | open | https://youtube.com/ | 0 | Open Youtube in the default browser
reddit | open | https://reddit.com/ | 0 | Open Reddit in the default browser
social | open | https://facebook.com/,https://reddit.com/,https://x.com | 0 | Open multiple social media websites`
		);
	}

	await helper.log(`User executed the command: ${input}`);

	/**
	 * Read commands from commands.txt
	 */
	const content = await helper.readFile(commandFile);
	const commands = content.split("\n").reduce((accumulator, line) => {
		// Ignore comment lines and empty lines
		if (line.trim().startsWith("#") || !line.trim()) return accumulator;

		let [commands, action, action_target, shell_pass_parameters, description] = line
			.split("|")
			.map((l) => l.trim());

		for (let command of commands.split(",")) {
			accumulator.push({
				command,
				action,
				action_target: action_target.replaceAll("%pipe%", "|"),
				shell_pass_parameters,
				description,
			});
		}

		return accumulator;
	}, []);

	/**
	 * Extract parameters from command
	 * For example: run test --flag will have the command of run test and the params is --flag
	 *              (if 'run test' is one of the valid commands)
	 */
	let { command, params } = helper.extractCommand(input, commands);

	if (!command) {
		await helper.log(`Unable to determine action for user input. Exitting...`);
		helper.notify(`Failed: No action found for input ${input}`);
		// Don't exit immediately so notify can show
		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(true);
				process.exit();
			}, 1000);
		});
	}

	await helper.log(`Command: ${command}. Params: ${params}`);

	const commandData = commands.filter((entry) => entry.command.toLowerCase() === command.toLowerCase())[0] || [];
	console.log(commandData);

	await helper.log(`Command data:\n${JSON.stringify(commandData, null, 2)}`);

	// If shell_pass_parameters is disabled, don't forward params
	if (commandData.shell_pass_paramters == 0) params = "";

	// Trigger action, if it's found
	if (typeof actions[commandData.action.toLowerCase()]) {
		await actions[commandData.action.toLowerCase()].call(null, { targets: commandData.action_target, params });
		await helper.log(`Action ${commandData.action} run successfully.`);
		helper.notify(`Completed: ${commandData.description || input}`);
	} else {
		// No action found, check if default is available
		if (typeof actions.default) {
			await actions.default.call(null, { targets: commandData.action_target, params });
			await helper.log(`Default action run successfully.`);
			helper.notify(`Completed: default action.`);
		} else {
			console.log("No action found.");
			await helper.log(`No action found for  ${commandData.action} run successfully.`);
			await helper.notify(`Failed: ${commandData.description || input}`);
		}
	}
})();
