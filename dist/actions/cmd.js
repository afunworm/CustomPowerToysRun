const Helper = require("../functions.js");
const helper = new Helper();

module.exports = async function ({ targets, params }) {
	console.log("Calling processor cmd...");

	try {
		let command = `${targets.trim()}${params.trim() ? " " + params.trim() : ""}`;
		const { stdout } = await helper.run(command, "cmd");
		console.log(stdout);
		console.log(`Command ${command} ran successfully through Command Prompt.`);
	} catch (error) {
		console.log(error);
	}
};
