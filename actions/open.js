const Helper = require("../functions.js");
const helper = new Helper();

module.exports = async function ({ targets, params }) {
	if (!targets) {
		console.log(`No appropriate target found for ${targets}`);
		return;
	}

	console.log("Calling processor open...");

	try {
		const openedTargets = await helper.open(targets, params);
		console.log(`Successfully opened ${openedTargets}`);
	} catch (error) {
		console.error(`Failed to open ${targets}:`, error);
	}
};
