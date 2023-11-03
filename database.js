const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("mydb.db");

db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS android_demos (token INT, apk BLOB, name TEXT, packageName TEXT, url TEXT, logo BLOB, versionCode INT)");

    db.run("CREATE TABLE IF NOT EXISTS android_finals (token INT,email TEXT, bundle BLOB, apk BLOB, name TEXT, packageName TEXT, url TEXT, logo BLOB, versionCode INT)");

    db.run("CREATE TABLE IF NOT EXISTS ios_demos (token INT, debugSimulator BLOB, name TEXT, packageName TEXT, url TEXT, logo BLOB, versionCode INT)");
});

module.exports = db;