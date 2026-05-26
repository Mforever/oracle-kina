const { getDB } = require("../db");
const { getMayanData } = require("../mayan");
const { sendEmail, getShortEmailTemplate } = require("../email");
const fs = require("fs");
const path = require("path");

async function subscribeRoute(req, res, body) {
  try {
    const { email, date } = JSON.parse(body);

    if (!email) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Нужен email" }));
      return;
    }

    // Сохраняем email
    const subscribersPath = path.join(
      __dirname,
      "..",
      "..",
      "subscribers.json",
    );
    let subscribers = [];
    try {
      if (fs.existsSync(subscribersPath)) {
        subscribers = JSON.parse(fs.readFileSync(subscribersPath, "utf-8"));
      }
    } catch (e) {
      subscribers = [];
    }
    if (!subscribers.find((s) => s.email === email)) {
      subscribers.push({ email, date: new Date().toISOString() });
      fs.writeFileSync(subscribersPath, JSON.stringify(subscribers, null, 2));
      console.log(`📧 Новый подписчик: ${email}`);
    }

    // Отправляем краткий гороскоп если есть дата
    if (date) {
      const mayanData = getMayanData(date);
      if (mayanData) {
        const emailHtml = getShortEmailTemplate(mayanData, date);
        await sendEmail(email, "🐆 Твой знак в календаре Цолькин", emailHtml);
      }
    }

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    console.error("❌ Ошибка подписки:", err.message);
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Ошибка сервера" }));
  }
}

module.exports = { subscribeRoute };
