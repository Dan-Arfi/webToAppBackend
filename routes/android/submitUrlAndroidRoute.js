const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { updateAndroidName, updateAppIcons } = require("../../updateController");
const db = require("../../database");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const repoUrl = "https://github.com/Dan-Arfi/android-template.git";

const router = express.Router();



router.post("/", upload.single("logo"), async (req, res) => {
    try {
      console.log(__dirname);
      console.log(__filename);
      console.log(req.body);
      const token = Date.now(); // You need to define this function
      const body = req.body;
      console.log(req.body);
  
      const url = body["url"];
      const name = body["name"];
      const packageName = body["packageName"];
      console.log("Received URL:", url);
  
      const logoPath = req.file.path; // Assuming the file is uploaded correctly
      const logoData = fs.readFileSync(logoPath, { encoding: "base64" }); // Convert logo data to base64
  
      exec(
        `cd androidProjects && git clone ${repoUrl} androidTemplate${token}`,
        async (error, stdout, stderr) => {
          if (error) {
            console.error(`Error cloning the repository: ${error}`);
            return;
          }
  
          var projectPath = "androidProjects/androidTemplate" + token;
          const filePath =
            projectPath + "/app/build/outputs/apk/debug/app-debug.apk"; // Replace with the actual APK file patht
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
          await updateAppIcons(logoPath, projectPath);
  
          const data = fs.readFileSync(mainActivityPath, "utf8");
          const updatedData = data.replace(
            /private var url: String = ".*"/,
            `private var url: String = "${url}"`
          );
          fs.writeFileSync(mainActivityPath, updatedData, "utf8");
          console.log("URL has been updated successfully");
  
          exec(
            "cd " +
              projectPath +
              " && ./gradlew clean && ./gradlew assembleDebug",
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
              // res.status(200).send("APK build successful");
  
              const apkData = fs.readFileSync(filePath);
              db.run(
                "INSERT INTO android_demos (token, apk, name, packageName, url, logo, versionCode) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [token, apkData, name, packageName, url, logoData, 1.0],
                function (err) {
                  if (err) {
                    console.error("Error storing APK in the database:", err);
                    return res.status(500).send("Internal Server Error");
                  }
                  const responseData = {
                    token: token,
                    name: name,
                    url: url,
                    packageName: packageName,
                  };
                  res.status(200).send(responseData);
                }
              );
            }
          );
        }
      );
    } catch (err) {
      console.error("Error during file operations:", err);
      return res.status(500).send("Internal Server Error");
    }
  });





module.exports = router;