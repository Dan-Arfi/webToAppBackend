const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
require("dotenv/config");
const history = require('connect-history-api-fallback');
const app = express();
const PORT = process.env.PORT;
const port = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static("dist", { maxAge: "1y", etag: false }));
app.use(history());

const repoUrl = "https://github.com/Dan-Arfi/android-template.git";

// let db = new sqlite3.Database("mydb.db");

// db.serialize(function () {
//   db.run(
//     "CREATE TABLE IF NOT EXISTS android_demos (token INT, apk BLOB, name TEXT, packageName TEXT, url TEXT, logo BLOB, versionCode INT)"
//   );

//   db.run(
//     "CREATE TABLE IF NOT EXISTS android_finals (token INT,email TEXT, bundle BLOB, apk BLOB, name TEXT, packageName TEXT, url TEXT, logo BLOB, versionCode INT)"
//   );
// });

// Android
const submitUrlRouteAndroid = require("./routes/android/submitUrlAndroidRoute");
const rebuildDemoRouteAndroid = require("./routes/android/rebuildDemoAndroidRoute");
const rebuildBundleRouteAndroid = require("./routes/android/rebuildBundleAndroidRoute");
const downloadDemoApkRouteAndroid = require("./routes/android/downloadDemoApkAndroidRoute");
const downloadFinalApkRouteAndroid = require("./routes/android/downloadFinalApkAndroidRoute");
const downloadBundleRouteAndroid = require("./routes/android/downloadBundleAndroidRoute");
const getAllAppsRouteAndroid = require("./routes/android/getAllAppsAndroidRoute");
const getDataRouteAndroid = require("./routes/android/getDataAndroidRoute");
const getFinalDataRouteAndroid = require("./routes/android/getFinalDataAndroidRoute");
const buildFinalRouteAndroid = require("./routes/android/buildFinalAndroidRoute");

// Ios
const submitUrlRouteIos = require("./routes/ios/submitUrlIosRoute");
const downloadDemoZipIos = require("./routes/ios/downloadDemoZipIosRoute");
const getDataRotueIos = require("./routes/ios/getDataIosRoute");

app.use(express.json());

// Android
app.use("/submit-url-android", submitUrlRouteAndroid);
app.use("/rebuild-demo-android", rebuildDemoRouteAndroid);
app.use("/rebuild-bundle-android", rebuildBundleRouteAndroid);
app.use("/download-demo-apk-android", downloadDemoApkRouteAndroid);
app.use("/download-final-apk-android", downloadFinalApkRouteAndroid);
app.use("/download-bundle-android", downloadBundleRouteAndroid);
app.use("/get-all-apps-android", getAllAppsRouteAndroid);
app.use("/get-data-android", getDataRouteAndroid);
app.use("/get-final-data-android", getFinalDataRouteAndroid);
app.use("/build-final-android", buildFinalRouteAndroid);

// Ios
app.use("/submit-url-ios", submitUrlRouteIos);
app.use("/download-demo-zip-ios", downloadDemoZipIos);
app.use("/get-data-ios", getDataRotueIos);
app.get("*", (req, res) => {
  res.sendFile(__dirname + "/dist/index.html");
});
app.listen(PORT, (error) => {
  if (!error)
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});
