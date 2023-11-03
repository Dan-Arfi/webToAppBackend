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
  
      const body = req.body;
      const token = req.body["token"];
      const email = req.body["email"];
      console.log(req.body);
  
      db.get(
        "SELECT apk, name, packageName, url, logo, versionCode FROM android_demos WHERE token = ?",
        [token],
        async function (err, row) {
          if (err) {
            console.error("Error retrieving data from the database:", err);
            return res.status(404).send("Data not found");
          }
          if (!row) {
            return res.status(404).send("Data not found");
          }
          const { apk, name, packageName, url, logo, versionCode } = row;
  
          var projectPath = "androidProjects/androidTemplate" + token;
  
          // Function to create the keystore file
          const createKeystore = () => {
            const keystoreCreationCommand = `keytool -genkey -v -keystore ${projectPath}/keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -storepass ${token} -keypass ${token} -alias alias_name -dname "CN=${name}, OU=Unit, O=Organization, L=City, S=State, C=Country"`;
            exec(keystoreCreationCommand, (error, stdout, stderr) => {
              if (error) {
                console.error(`Error creating the keystore: ${error.message}`);
                return res.status(500).send("Internal Server Error");
              }
              console.log(`stdout: ${stdout}`);
              console.error(`stderr: ${stderr}`);
              // Call the function to sign the app bundle after creating the keystore
              signAppBundle();
            });
          };
  
          // Function to sign the app bundle
          const signAppBundle = () => {
            exec(
              `cd ${projectPath} && ./gradlew clean && ./gradlew bundleRelease`,
              async (error, stdout, stderr) => {
                if (error) {
                  console.error(
                    `Error building the app bundle: ${error.message}`
                  );
                  return res.status(500).send("Internal Server Error");
                }
                if (stderr) {
                  console.error(`stderr: ${stderr}`);
                  return res.status(500).send("Internal Server Error");
                }
                console.log(`stdout: ${stdout}`);
                // Call the function to build the app bundle after signing it
                buildAppBundle();
              }
            );
          };
  
          // Function to build the app bundle
          const buildAppBundle = () => {
            exec(
              `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ${projectPath}/keystore.jks -storepass ${token} -keypass ${token} ${projectPath}/app/build/outputs/bundle/release/app-release.aab alias_name`,
              async (error, stdout, stderr) => {
                if (error) {
                  console.error(`Error signing the app bundle: ${error.message}`);
                  return res.status(500).send("Internal Server Error");
                }
                if (stderr) {
                  console.error(`stderr: ${stderr}`);
                  return res.status(500).send("Internal Server Error");
                }
                console.log(`stdout: ${stdout}`);
                const bundlePath =
                  projectPath +
                  "/app/build/outputs/bundle/release/app-release.aab"; // Replace with the actual APK file patht
                const bundleData = fs.readFileSync(bundlePath);
                db.run(
                  "INSERT INTO android_finals (token,email, apk, bundle, name, packageName, url, logo, versionCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                  [
                    token,
                    email,
                    apk,
                    bundleData,
                    name,
                    packageName,
                    url,
                    logo,
                    versionCode,
                  ],
                  function (err) {
                    if (err) {
                      console.error("Error storing APK in the database:", err);
                      return res.status(500).send("Internal Server Error");
                    } else {
                      db.run("DELETE FROM android_demos WHERE token = ?", [
                        token,
                      ]);
                    }
                    res.status(200).send("success!");
                  }
                );
              }
            );
          };
  
          // Call the function to create the keystore file
          createKeystore();
        }
      );
    } catch (err) {
      console.error("Error during file operations:", err);
      return res.status(500).send("Internal Server Error");
    }
  });




module.exports = router;