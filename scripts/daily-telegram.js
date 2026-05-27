require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const { calculateMayanSign } = require("../server/mayan");
const fs = require("fs");
const path = require("path");
const https = require("https");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log("Настрой TELEGRAM_BOT_TOKEN и TELEGRAM_CHANNEL_ID в .env");
  process.exit(1);
}

const today = new Date();
const dd = String(today.getDate()).padStart(2, "0");
const mm = String(today.getMonth() + 1).padStart(2, "0");
const yyyy = today.getFullYear();
const todayStr = dd + "." + mm + "." + yyyy;

const kin = calculateMayanSign(todayStr);
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "maya_260_v2.json"), "utf-8"),
);
const sign = data.find((item) => item.id === kin);

if (!sign) {
  console.log("Знак не найден");
  process.exit(1);
}

const message = `🔮 Знак дня — ${sign.name_ru} ${sign.glyph_emoji}\n\n${sign.short_text}\n\nУзнай свой знак: https://maya-calendar.ru`;

const body = JSON.stringify({
  chat_id: CHANNEL_ID,
  text: message,
  parse_mode: "HTML",
});

const req = https.request(
  {
    hostname: "api.telegram.org",
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
  },
  (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () =>
      console.log(
        "✅ Отправлено:",
        JSON.parse(data).ok ? "OK" : JSON.parse(data).description,
      ),
    );
  },
);

req.write(body);
req.end();
