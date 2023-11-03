// updateController.js

const fs = require("fs");
const path = require("path");

async function updateAndroidVersionCode(versionCode, gradleFilePath) {
    try {
        let data = fs.readFileSync(gradleFilePath, "utf8");
        let result = data.replace(/versionCode\s+(.*)/, `versionCode ${versionCode}`);
        result = result.replace(/versionName\s+(.*)/, `versionName "${versionCode}"`);
        fs.writeFileSync(gradleFilePath, result, "utf8");
        console.log("Success!");
    } catch (err) {
        console.error("Error updating Android version code:", err);
    }
}

async function updateAndroidName(newAppName, newPackageName, stringsPath, mainActivityPath, manifestPath, gradleFilePath) {
    try {
        // Update the app name in strings.xml
        const stringsData = fs.readFileSync(stringsPath, "utf8");
        const updatedStringsData = stringsData.replace(/<string name="app_name">.*?<\/string>/, `<string name="app_name">${newAppName}</string>`);
        fs.writeFileSync(stringsPath, updatedStringsData, "utf8");
        console.log("strings.xml has been updated");

        // Update the package name in MainActivity.kt
        const data = fs.readFileSync(mainActivityPath, "utf8");
        let updatedData = data.replace(/^package\s+.*$/m, `package ${newPackageName}`);
        updatedData = updatedData.replace(/package\s+.*;/, `package ${newPackageName};`);
        const importRegex = /import\s+.*\.R/g;
        updatedData = updatedData.replace(importRegex, `import ${newPackageName}.R`);
        fs.writeFileSync(mainActivityPath, updatedData, "utf8");
        console.log("MainActivity.kt has been updated");

        let gradleData = fs.readFileSync(gradleFilePath, "utf8");
        let gradleResult = gradleData.replace(/applicationId\s+(.*)/, `applicationId "${newPackageName}"`);
        fs.writeFileSync(gradleFilePath, gradleResult, "utf8");

        // Update the package name in AndroidManifest.xml
        const manifestData = fs.readFileSync(manifestPath, "utf8");
        const packageRegex = /package="([^"]+)"/;
        const updatedManifestData = manifestData.replace(packageRegex, `package="${newPackageName}"`);
        fs.writeFileSync(manifestPath, updatedManifestData, "utf8");
        console.log("AndroidManifest.xml has been updated");
    } catch (err) {
        console.error("Error during file operations:", err);
    }
}

async function updateAppIcons(iconPath, projectPath) {
    try {
        const densities = ["hdpi", "mdpi", "xhdpi", "xxhdpi", "xxxhdpi", "anydpi"];

        for (const density of densities) {
            const destinationPath = path.join(projectPath, "app", "src", "main", "res", "mipmap-" + density, "ic_launcher.webp");

            if (fs.existsSync(destinationPath)) {
                // Copy the new icon to the destination path
                fs.copyFileSync(iconPath, destinationPath);
                console.log(`App icon for ${density} has been updated successfully`);
            } else {
                console.error(`Destination path for ${density} not found for app icon replacement`);
            }

            const destinationPath2 = path.join(projectPath, "app", "src", "main", "res", "mipmap-" + density, "ic_launcher_round.webp");

            if (fs.existsSync(destinationPath2)) {
                // Copy the new icon to the destination path
                fs.copyFileSync(iconPath, destinationPath2);
                console.log(`App icon for ${density} has been updated successfully`);
            } else {
                console.error(`Destination path for ${density} not found for app icon replacement`);
            }
        }
    } catch (err) {
        console.error("Error updating the app icon:", err);
    }
}

module.exports = { updateAndroidVersionCode, updateAndroidName, updateAppIcons };
