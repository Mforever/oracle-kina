require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "changeme",
  SESSION_SECRET: process.env.SESSION_SECRET || "default-secret-change-me",
  DB: {
    host: "localhost",
    user: "root",
    password: "",
    database: "maya_calendar",
    charset: "utf8mb4",
  },
  EMAIL: {
    host: "smtp.yandex.ru",
    port: 465,
    secure: true,
    auth: { user: "", pass: "" },
  },
  SITE_URL: process.env.SITE_URL || "http://localhost:3000",
  // Безопасность админки
  SESSION_TTL: 2 * 60 * 60 * 1000, // 2 часа
  MAX_LOGIN_ATTEMPTS: 5,
  BLOCK_TIME: 15 * 60 * 1000, // 15 минут
};
