const { getMayanData, getZodiacData } = require('../mayan');
const { sendEmail, getFullEmailTemplate } = require('../email');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const YooKassa = require('yookassa');

const yooKassa = new YooKassa({
  shopId: config.YOOKASSA.shopId,
  secretKey: config.YOOKASSA.secretKey
});

async function paymentRoute(req, res, body) {
  try {
    const d = JSON.parse(body);
    
    if (!d.email || !d.date) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Нужны email и дата' }));
      return;
    }

    console.log('💰 Платёж:', d.email, d.date);

    const mayan = getMayanData(d.date);
    const zodiac = getZodiacData(d.date);

    // Создаём платёж в ЮKassa
    const payment = await yooKassa.createPayment({
      amount: {
        value: '299.00',
        currency: 'RUB'
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: config.SITE_URL + '/oracle.html?payment=success'
      },
      description: 'Полный Оракул Кина на 2026 год',
      metadata: {
        email: d.email,
        date: d.date
      }
    });

    console.log('✅ Платёж создан:', payment.id);

    // Отправляем полный гороскоп на почту
    const emailHtml = getFullEmailTemplate(mayan, zodiac, d.date);
    await sendEmail(d.email, '🔮 Твой полный Оракул Кина на 2026 год', emailHtml);

    // Сохраняем заказ
    const ordersPath = path.join(__dirname, '..', '..', 'orders.json');
    let orders = [];
    try {
      if (fs.existsSync(ordersPath)) {
        orders = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
      }
    } catch (e) {}
    orders.push({
      email: d.email,
      date: d.date,
      mayanId: mayan?.id,
      mayanName: mayan?.name_ru,
      paymentId: payment.id,
      status: payment.status,
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

    // Сохраняем подписчика
    const subsPath = path.join(__dirname, '..', '..', 'subscribers.json');
    let subs = [];
    try {
      if (fs.existsSync(subsPath)) {
        subs = JSON.parse(fs.readFileSync(subsPath, 'utf-8'));
      }
    } catch (e) {}
    if (!subs.find(s => s.email === d.email)) {
      subs.push({ email: d.email, date: new Date().toISOString() });
      fs.writeFileSync(subsPath, JSON.stringify(subs, null, 2));
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      paymentUrl: payment.confirmation.confirmation_url,
      fullText: mayan?.full_text || '',
      zodiacText: zodiac?.full_text || '',
      mayanName: mayan?.name_ru || '',
      glyph: mayan?.glyph_emoji || ''
    }));

  } catch (e) {
    console.error('❌ Ошибка оплаты:', e.message);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Ошибка создания платежа. Попробуй позже.' }));
  }
}

module.exports = { paymentRoute };
