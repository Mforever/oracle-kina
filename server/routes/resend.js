const { getMayanData, getZodiacData } = require("../mayan");
const { sendEmail, getFullEmailTemplate } = require("../email");
const config = require("../config");

async function resendRoute(req, res, body) {
  try {
    const d = JSON.parse(body);
    if (!d.email || !d.date) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Нужны email и дата" }));
      return;
    }

    const mayan = getMayanData(d.date);
    const zodiac = getZodiacData(d.date);
    const html = getFullEmailTemplate(mayan, zodiac, d.date);
    await sendEmail(d.email, "🔮 Твой полный Оракул Кина на 2026 год", html);

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ success: true }));
  } catch (e) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Ошибка" }));
  }
}

module.exports = { resendRoute };
