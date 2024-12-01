const Helper = require("../functions.js");
const helper = new Helper();

module.exports = async function ({ targets }) {
	if (!targets) {
		console.log(`No appropriate target found for ${targets}`);
		return;
	}

	console.log("Calling processor open...");

	try {
		await helper.open(targets);
		console.log(`Successfully opened ${targets}`);
	} catch (error) {
		console.error(`Failed to open ${targets}:`, error);
	}
};
