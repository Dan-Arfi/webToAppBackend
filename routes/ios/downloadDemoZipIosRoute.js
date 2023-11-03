const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { updateAndroidName, updateAppIcons } = require("../../updateController");
const db = require("../../database");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const repoUrl = "https://github.com/Dan-Arfi/ios-template.git";
const xcode = require("xcode");
const archiver = require("archiver");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const token = req.query.token;

    db.get("SELECT debugSimulator FROM ios_demos WHERE token = ?", [token], (err, row) => {
      if (err) {
        console.error("Error retrieving file from the database:", err);
        return res.status(500).send("Internal Server Error");
      }

      if (!row) {
        return res.status(404).send("File not found");
      }

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="iosTemplate${token}.zip"`
      );
      res.send(row.debugSimulator);
    });
  } catch (error) {
    console.error("Error retrieving file from the database:", error);
    return res.status(500).send("Internal Server Error");
  }
});




module.exports = router;
