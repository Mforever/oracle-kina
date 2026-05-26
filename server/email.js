const config = require("./config");
let transporter = null;

function getTransporter() {
  if (!transporter && config.EMAIL.auth.user) {
    const nodemailer = require("nodemailer");
    transporter = nodemailer.createTransport(config.EMAIL);
  }
  return transporter;
}

async function sendEmail(to, subject, html) {
  const transport = getTransporter();

  if (!transport) {
    console.log(`📧 [ЗАГЛУШКА] Письмо для ${to}: "${subject}"`);
    return true;
  }

  try {
    const info = await transport.sendMail({
      from: '"Оракул Кина" <noreply@oracle-kina.ru>',
      to,
      subject,
      html,
    });
    console.log(`📧 Письмо отправлено: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error("❌ Ошибка отправки:", err.message);
    return false;
  }
}

function getShortEmailTemplate(mayanData, date) {
  return `
    <div style="background:#0a0a0f; color:#e8e6e3; padding:40px 20px; font-family:Arial,sans-serif;">
        <div style="max-width:550px; margin:0 auto; background:#1a1a25; border-radius:20px; padding:36px; border:1px solid #2a2a35;">
            <div style="text-align:center; font-size:56px; margin-bottom:12px;">${mayanData.glyph_emoji || "🔮"}</div>
            <h2 style="text-align:center; color:#d4a853; font-size:24px;">${mayanData.name_ru}</h2>
            <p style="text-align:center; color:#989898; font-size:14px; margin-bottom:24px;">${mayanData.name_original} · Кин ${mayanData.id}</p>
            <p style="font-size:15px; color:#e8e6e3; line-height:1.7;">${mayanData.short_text}</p>
            <div style="text-align:center; margin-top:28px; padding-top:24px; border-top:1px solid #2a2a35;">
                <p style="color:#d4a853; font-weight:bold; margin-bottom:16px;">Это краткое толкование. Полный Оракул Кина ждёт тебя!</p>
                <a href="${config.SITE_URL}/?date=${date}" style="display:inline-block; background:#d4a853; color:#0a0a0f; padding:14px 32px; border-radius:12px; text-decoration:none; font-weight:bold;">Открыть полный Оракул →</a>
            </div>
        </div>
    </div>`;
}

function getFullEmailTemplate(mayanData, zodiacData, date) {
  const fullText = mayanData?.full_text || "Твой полный гороскоп на 2026 год.";
  const zodiacText = zodiacData?.full_text || "";
  return `
    <div style="background:#0a0a0f; color:#e8e6e3; padding:40px 20px; font-family:Arial,sans-serif;">
        <div style="max-width:550px; margin:0 auto; background:#1a1a25; border-radius:20px; padding:36px; border:1px solid #d4a853;">
            <div style="text-align:center; font-size:64px; margin-bottom:12px;">${mayanData?.glyph_emoji || "🔮"}</div>
            <h1 style="text-align:center; color:#d4a853; font-size:28px;">${mayanData?.name_ru || "Твой знак"}</h1>
            <p style="text-align:center; color:#989898; font-size:14px; margin-bottom:28px;">Полный Оракул Кина на 2026 год</p>
            <div style="font-size:15px; color:#e8e6e3; line-height:1.8; white-space:pre-line;">${fullText}</div>
            ${zodiacText ? `<div style="margin-top:28px; padding-top:24px; border-top:1px solid #2a2a35; font-size:14px; color:#989898; line-height:1.7;">${zodiacText}</div>` : ""}
            <div style="text-align:center; margin-top:28px; padding-top:24px; border-top:1px solid #2a2a35;">
                <p style="color:#555; font-size:12px;">© 2026 Оракул Кина · Календарь Цолькин</p>
            </div>
        </div>
    </div>`;
}

module.exports = { sendEmail, getShortEmailTemplate, getFullEmailTemplate };
