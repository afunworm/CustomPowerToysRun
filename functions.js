const path = require("path");
const fs = require("fs").promises;
const { readFile, writeFile, appendFile, access } = require("fs/promises");
const exec = require("child_process").exec;
const util = require("util");
const notifier = require("node-notifier");
const { spawn } = require("child_process");
const os = require("os");

module.exports = class {
	constructor() {}

	async loadActions() {
		try {
			// Store actions
			let actions = {};

			// Resolve the absolute path to the directory relative to this script
			const actionsDir = path.resolve("./actions");

			// Read the contents of the directory
			const files = await fs.readdir(actionsDir, { withFileTypes: true });

			// Filter for files that are regular files and end with '.js'
			const jsFiles = files
				.filter((file) => file.isFile() && path.extname(file.name).toLowerCase() === ".js")
				.map((file) => file.name);

			for (let jsFile of jsFiles) {
				let actionFile = path.basename(jsFile);
				let actionPath = path.resolve(`./actions/${actionFile}`);
				let actionName = path.basename(actionPath, path.extname(actionPath));

				actions[actionName.toLowerCase()] = require(actionPath);
			}

			return actions;
		} catch (error) {
			// Enhance the error message with context
			console.log(error.message);
		}
	}

	extractCommand(input, list) {
		// Use Set to avoid duplicates
		let availableCommands = new Set();

		// Trim input
		input = input.trim();

		list.map((entry) => {
			availableCommands.add(entry.command);
		});
		const commandList = Array.from(availableCommands);

		let inputCommand = "";
		for (let command of commandList) {
			if (input.toLowerCase().startsWith(command.toLowerCase())) inputCommand = command;
		}
		if (!inputCommand) {
			return {
				command: "",
				params: "",
			};
		}

		return {
			command: inputCommand,
			params: input.split(inputCommand)[1].trim(),
		};
	}

	fileExists(filePath) {
		return new Promise(async (resolve) => {
			try {
				await access(filePath);
				resolve(true);
			} catch (error) {
				resolve(false);
			}
		});
	}

	async readFile(filePath) {
		try {
			return readFile(filePath, "utf8");
		} catch (error) {
			console.log(`Cannot read file ${filePath}`);
		}
	}

	async writeFile(filePath, content) {
		try {
			return await writeFile(filePath, content, "utf8");
		} catch (error) {
			console.log(`Cannot read file ${filePath}`);
		}
	}

	async appendFile(filePath, content) {
		try {
			return await appendFile(filePath, content, "utf8");
		} catch (error) {
			console.log(`Cannot read file ${filePath}`);
		}
	}

	run(command, type = "powershell") {
		const run = util.promisify(exec);
		const windowsHide = true;
		return type === "powershell"
			? run(command, { shell: "powershell.exe", windowsHide })
			: run(command, { windowsHide });
	}

	async open(targets, params = "") {
		const start = process.platform == "darwin" ? "open" : process.platform == "win32" ? "start" : "xdg-open";
		let shellCommand = "";

		targets = targets.split(",").map((target) => {
			shellCommand += `${start} '${target}${params.trim() ? params.trim() : ""}';`;
			return shellCommand;
		});

		await this.run(shellCommand);
		return targets;
	}

	getPluginDir() {
		const localAppDataPath = process.env.LOCALAPPDATA;
		return `${localAppDataPath}\\Microsoft\\PowerToys\\PowerToys Run\\Plugins\\CustomPowerToysRun`;
	}

	async log(message) {
		/**
		 * Get current timestamp
		 */
		const now = new Date();

		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are zero-based
		const day = String(now.getDate()).padStart(2, "0");

		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");
		const seconds = String(now.getSeconds()).padStart(2, "0");

		const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

		/**
		 * Get log file path
		 */
		const pluginDir = this.getPluginDir();
		const logFilePath = `${pluginDir}\\logs.txt`;
		await appendFile(logFilePath, `[${timestamp}] ${message}\n`, "utf8");
	}

	notify(message = "", title = "Custom PowerToys Run") {
		if (!message) return;

		/**
		 * Get log file path
		 */
		const pluginDir = this.getPluginDir();
		const icon = `${pluginDir}\\icon.png`;

		return notifier.notify({
			title,
			message,
			icon,
			sound: true,
			appID: "Microsoft.PowerToysWin32",
		});
	}
};
