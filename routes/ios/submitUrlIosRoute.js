const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const db = require("../../database");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const repoUrl = "https://github.com/Dan-Arfi/ios-template.git";
const xcode = require("xcode");
const archiver = require("archiver");
const router = express.Router();

router.post("/", upload.single("logo"), async (req, res) => {
  try {
    console.log(__dirname);
    console.log(__filename);
    console.log(req.body);
    const token = Date.now(); // You need to define this function
    const body = req.body;
    console.log(req.body);
    const branchName = `branch-${token}`;
    const url = body["url"];
    const name = body["name"];
    const packageName = body["packageName"];
    console.log("Received URL:", url);
    const logoPath = req.file.path; // Assuming the file is uploaded correctly
    const logoData = fs.readFileSync(logoPath, { encoding: "base64" }); // Convert logo data to base64

    await new Promise((resolve, reject) => {
      exec(
        `cd iosProjects && git clone ${repoUrl} iosTemplate${token} && cd iosTemplate${token} && git checkout -b ${branchName}`,
        async (error, stdout, stderr) => {
          if (error) {
            console.error(`Error cloning the repository: ${error}`);
            return reject(error);
          }

          var projectPath = "iosProjects/iosTemplate" + token;

          var xcodePath =
            projectPath + "/iosTemplate.xcodeproj/project.pbxproj";
          const project = xcode.project(xcodePath);

          project.parseSync();

          const target = project.getFirstTarget().firstTarget;
          const productName = name;
          project.updateProductName(productName, target);
          fs.writeFileSync(xcodePath, project.writeSync());

          fs.readFile(xcodePath, "utf8", (err, data) => {
            if (err) {
              console.error("Error reading the Xcode project file:", err);
              return reject(err);
            }

            let result = data.replace(
              /PRODUCT_BUNDLE_IDENTIFIER = .*;/g,
              `PRODUCT_BUNDLE_IDENTIFIER = ${packageName};`
            );

            fs.writeFile(xcodePath, result, "utf8", (err) => {
              if (err) {
                console.error("Error writing to the Xcode project file:", err);
                return reject(err);
              }
              console.log(
                "Bundle identifier (bundle ID) updated successfully."
              );
              console.log("success!");

              const contentViewPath = path.join(
                projectPath,
                "iosTemplate",
                "ContentView.swift"
              );

              fs.readFile(contentViewPath, "utf8", (err, data) => {
                if (err) {
                  console.error("Error reading ContentView.swift:", err);
                  return reject(err);
                }

                const updatedData = data.replace(
                  /@State private var urlString = ".*"/,
                  `@State private var urlString = "${url}"`
                );

                fs.writeFile(contentViewPath, updatedData, "utf8", (err) => {
                  if (err) {
                    console.error("Error writing to ContentView.swift:", err);
                    return reject(err);
                  }
                  console.log(
                    "ContentView.swift has been updated successfully."
                  );

                  const appIconPath = path.join(
                    projectPath,
                    "iosTemplate",
                    "Assets.xcassets",
                    "AppIcon.appiconset",
                    "icon.png"
                  );

                  const appIconData = fs.readFileSync(logoPath);

                  fs.writeFile(appIconPath, appIconData, (err) => {
                    if (err) {
                      console.error("error setting icon: ", err);
                      return reject(err);
                    }

                    exec(
                      `git branch`,
                      (error, stdout, stderr) => {
                        if (error) {
                          console.log("error: " + error);
                        }
                        exec(
                          `cd ${projectPath} && xcodebuild -project 'iosTemplate.xcodeproj' -sdk iphonesimulator -configuration Debug`,
                          async (error, stdout, stderr) => {
                            if (error) {
                              console.error(`Error building debug: ${error}`);
                              return reject(error);
                            }
                            console.log("Simulator demo built successfully");
                            const appFolderPath = path.join(
                              projectPath,
                              "build",
                              "Debug-iphonesimulator"
                            );

                            const appPath = path.join(
                              projectPath,
                              "build",
                              "Debug-iphonesimulator"
                            );
                            const output = fs.createWriteStream(
                              path.join(projectPath, `iosTemplate${token}.zip`)
                            );
                            const archive = archiver("zip", {
                              zlib: { level: 9 },
                            });
                            archive.pipe(output);
                            archive.directory(appPath, false);
                            archive.finalize();

                            output.on("close", async () => {
                              console.log(archive.pointer() + " total bytes");
                              console.log(
                                "Archiver has been finalized and the output file descriptor has closed."
                              );
                              const file = path.join(
                                projectPath,
                                `iosTemplate${token}.zip`
                              );

                              const data = fs.readFileSync(file);

                              db.run(
                                "INSERT INTO ios_demos (token, debugSimulator, name, packageName, url, logo, versionCode) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                [
                                  token,
                                  data,
                                  name,
                                  packageName,
                                  url,
                                  logoData,
                                  1.0,
                                ],
                                function (err) {
                                  if (err) {
                                    console.error(
                                      "Error storing ios zip in the database:",
                                      err
                                    );
                                    return reject(err);
                                  }
                                  fs.unlinkSync(file);
                                  const responseData = {
                                    token: token,
                                    name: name,
                                    url: url,
                                    packageName: packageName,
                                  };
                                  res.status(200).send(responseData);
                                }
                              );
                            });
                          }
                        );
                      }
                    );
                  });
                });
              });
            });
          });
        }
      );
    });
  } catch (err) {
    console.error("Error during file operations:", err);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
