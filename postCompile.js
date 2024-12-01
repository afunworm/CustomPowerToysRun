const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");

/**
 * Copies a single file from source to destination.
 * @param {string} src - Source file path.
 * @param {string} dest - Destination file path.
 */
async function copyFile(operations) {
	for (const { src, dest } of operations) {
		try {
			// Check if source file exists
			if (fs.existsSync(src)) {
				// Ensure the destination directory exists
				await fse.ensureDir(path.dirname(dest));

				// Copy the file
				await fse.copy(src, dest, { overwrite: true });
				console.log(`✅ Successfully copied file from "${src}" to "${dest}"`);
			} else {
				console.warn(`⚠️  Source file does not exist: "${src}"`);
			}
		} catch (error) {
			console.error(`❌ Error copying file from "${src}" to "${dest}":`, error);
		}
	}
}

/**
 * Copies a list of source directories to their respective destination directories.
 * Checks if each source directory exists before attempting to copy.
 */
async function copyFolders(operations) {
	for (const { src, dest } of operations) {
		try {
			// Check if source directory exists
			if (fs.existsSync(src)) {
				// Ensure the destination directory exists
				await fse.ensureDir(dest);

				// Copy the source directory to the destination
				await fse.copy(src, dest, { overwrite: true });
				console.log(`✅ Successfully copied from "${src}" to "${dest}"`);
			} else {
				console.warn(`⚠️  Source folder does not exist: "${src}"`);
			}
		} catch (error) {
			console.error(`❌ Error copying from "${src}" to "${dest}":`, error);
		}
	}
}

// Execute the copyFolders function
copyFolders([
	{
		src: path.join(__dirname, "node_modules", "node-notifier", "vendor", "snoreToast"),
		dest: path.join(__dirname, "dist", "notifier"),
	},
	{
		src: path.join(__dirname, "actions"),
		dest: path.join(__dirname, "dist", "actions"),
	},
	{
		src: path.join(__dirname, "wrapper", "Wrapper", "bin", "x64", "Debug", "net8.0-windows"),
		dest: path.join(__dirname, "dist"),
	},
	{
		src: path.join(__dirname, "wrapper", "Wrapper", "bin", "x86", "Debug", "net8.0-windows"),
		dest: path.join(__dirname, "dist"),
	},
]);
copyFile([
	{
		src: path.join(__dirname, "icon.png"),
		dest: path.join(__dirname, "dist", "icon.png"),
	},
]);
