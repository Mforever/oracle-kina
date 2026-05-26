const config = require("./config");
let mysql = null;
let db = null;

async function getDB() {
  if (!mysql) {
    try {
      mysql = require("mysql2/promise");
    } catch (e) {
      console.log("⚠️ mysql2 не установлен. Работаем с JSON.");
      return null;
    }
  }

  if (mysql && !db) {
    try {
      db = await mysql.createConnection(config.DB);
      console.log("✅ MySQL подключен");
    } catch (e) {
      console.log("⚠️ MySQL недоступен. Работаем с JSON.");
      db = null;
    }
  }

  return db;
}

module.exports = { getDB };
