const { getDB } = require("../db");
const { getMayanData, getZodiacData } = require("../mayan");
const { sendEmail, getFullEmailTemplate } = require("../email");
const config = require("../config");
const fs = require("fs");
const path = require("path");

async function paymentRoute(req, res, body) {
  try {
    const { email, date } = JSON.parse(body);

    if (!email || !date) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Нужны email и дата" }));
      return;
    }

    console.log(`💰 Оплата: ${email}, дата: ${date}`);

    const mayanData = getMayanData(date);
    const zodiacData = getZodiacData(date);

    // Отправляем полный гороскоп на почту
    const emailHtml = getFullEmailTemplate(mayanData, zodiacData, date);
    await sendEmail(email, "🔮 Твой полный Оракул Кина на 2026 год", emailHtml);

    // Сохраняем заказ
    const ordersPath = path.join(__dirname, "..", "..", "orders.json");
    let orders = [];
    try {
      if (fs.existsSync(ordersPath)) {
        orders = JSON.parse(fs.readFileSync(ordersPath, "utf-8"));
      }
    } catch (e) {
      orders = [];
    }
    orders.push({
      email,
      date,
      mayanId: mayanData?.id || null,
      mayanName: mayanData?.name_ru || "Неизвестно",
      sentAt: new Date().toISOString(),
    });
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

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
    }

    // Возвращаем полный гороскоп для показа на экране
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        success: true,
        paymentUrl: `${config.SITE_URL}/?payment=success`,
        fullText: mayanData?.full_text || "",
        zodiacText: zodiacData?.full_text || "",
        mayanName: mayanData?.name_ru || "",
        glyph: mayanData?.glyph_emoji || "",
      }),
    );
  } catch (err) {
    console.error("❌ Ошибка оплаты:", err.message);
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Ошибка сервера" }));
  }
}

module.exports = { paymentRoute };
