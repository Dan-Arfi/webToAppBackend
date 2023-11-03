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




router.post("/", async (req, res) => {
    try {
      const { email } = req.body;
      console.log(email);
      db.all(
        "SELECT name, packageName, token, url, logo, versionCode FROM android_finals WHERE email = ?",
        [email],
        function (err, rows) {
          if (err) {
            console.error("Error retrieving data from the database:", err);
            return res.status(404).send("Data not found");
          }
          if (!rows) {
            return res.status(404).send("Data not found");
          }
  
          // Processing each row to add logoData
          const processedRows = rows.map((row) => {
            const logo = row.logo;
            const logoData = Buffer.from(logo, "base64").toString("base64");
            return { ...row, logoData };
          });
  
          const data = { rows: processedRows };
          res.status(200).json(data);
        }
      );
    } catch (error) {
      console.error("Error retrieving data:", error);
      return res.status(500).send("Internal Server Error");
    }
  });




module.exports = router;