const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { updateAndroidName, updateAppIcons } = require("../../updateController");
const db = require("../../database");
const multer = require("multer");

const router = express.Router();



router.get("/:token", async (req, res) => {
    try {
      const token = req.params.token;
      db.get(
        "SELECT name, packageName, url, logo, versionCode FROM ios_demos WHERE token = ?",
        [token],
        function (err, row) {
          if (err) {
            console.error("Error retrieving data from the database:", err);
            return res.status(404).send("Data not found");
          }
          if (!row) {
            return res.status(404).send("Data not found");
          }
          const { name, packageName, url, logo, versionCode } = row;
          const logoData = Buffer.from(logo, "base64").toString("base64");
          const data = {
            name: name,
            packageName: packageName,
            url: url,
            logo: logoData,
            versionCode: versionCode,
          };
          res.status(200).json(data);
        }
      );
    } catch (error) {
      console.error("Error retrieving data:", error);
      return res.status(500).send("Internal Server Error");
    }
  });


module.exports = router;