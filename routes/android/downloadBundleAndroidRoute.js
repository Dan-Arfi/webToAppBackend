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



router.get("/", async (req, res) => {
    const token = req.query.token;
  
    db.get(
      "SELECT bundle FROM android_finals WHERE token = ?",
      [token],
      function (err, row) {
        if (err) {
          console.error("Error retrieving bundle from the database:", err);
          return res.status(404).send("File not found");
        }
        if (!row) {
          return res.status(404).send("File not found");
        }
        const bundleData = row.bundle;
        res.setHeader(
          "Content-disposition",
          `attachment; filename=app-release.aab`
        );
        res.setHeader("Content-Type", "application/vnd.android.package-archive");
        res.send(bundleData);
      }
    );
  });





module.exports = router;