const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { updateAndroidName, updateAppIcons, updateAndroidVersionCode } = require("../../updateController");
const db = require("../../database");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const repoUrl = "https://github.com/Dan-Arfi/android-template.git";

const router = express.Router();



router.post("/", upload.single("logo"), async (req, res) => {
    try {
      const body = req.body;
      const token = body.token;
      const name = body.name;
      const packageName = body.packageName;
      const versionCode = body.versionCode;
      const logoPath = req.file ? req.file.path : null;
  
      if (!token) {
        return res.status(400).send("Token is required for rebuild");
      }
  
      let projectPath = `androidProjects/androidTemplate${token}`;
      if (!fs.existsSync(projectPath)) {
        return res.status(404).send("Project not found for the given token");
      }
  
      const filePath = projectPath + "/app/build/outputs/apk/debug/app-debug.apk";
      const bundlePath =
        projectPath + "/app/build/outputs/bundle/release/app-release.aab"; // Replace with t
      const mainActivityPath = path.join(
        projectPath,
        "app",
        "src",
        "main",
        "java",
        "com",
        "example",
        "androidtemplate",
        "MainActivity.kt"
      );
      const manifestPath = path.join(
        projectPath,
        "app",
        "src",
        "main",
        "AndroidManifest.xml"
      );
      const stringsPath = path.join(
        projectPath,
        "app",
        "src",
        "main",
        "res",
        "values",
        "strings.xml"
      );
  
      const gradleFilePath = path.join(projectPath, "app", "build.gradle");
  
      await updateAndroidName(
        name,
        packageName,
        stringsPath,
        mainActivityPath,
        manifestPath,
        gradleFilePath
      );
  
      await updateAndroidVersionCode(versionCode, gradleFilePath, packageName);
  
      if (logoPath) {
        await updateAppIcons(logoPath, projectPath);
      }
  
      exec(
        "cd " + projectPath + " && ./gradlew clean && ./gradlew assembleDebug",
        async (error, stdout, stderr) => {
          if (error) {
            console.error(`Error building the app: ${error.message}`);
            return res.status(500).send("Internal Server Error");
          }
          if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send("Internal Server Error");
          }
          console.log(`stdout: ${stdout}`);
  
          const apkData = fs.readFileSync(filePath);
          if (logoPath) {
            const logoData = fs.readFileSync(logoPath, { encoding: "base64" }); // Convert logo data to base64
            db.run(
              "UPDATE android_demos SET  apk = ?, name = ?, packageName = ?, logo = ?, versionCode = ? WHERE token = ?",
              [apkData, name, packageName, logoData, versionCode, token],
              function (err) {
                if (err) {
                  console.error("Error updating APK in the database:", err);
                  return res.status(500).send("Internal Server Error");
                }
                res.status(200).send({ token: token, name: name, packageName });
              }
            );
          } else {
            db.run(
              "UPDATE android_demos SET apk = ?, name = ?, packageName = ?, versionCode = ? WHERE token = ?",
              [apkData, name, packageName, versionCode, token],
              function (err) {
                if (err) {
                  console.error("Error updating APK in the database:", err);
                  return res.status(500).send("Internal Server Error");
                }
                res.status(200).send({ token: token, name: name, packageName });
              }
            );
          }
        }
      );
    } catch (err) {
      console.error("Error during file operations:", err);
      return res.status(500).send("Internal Server Error");
    }
  });





module.exports = router;