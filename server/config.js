require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

module.exports = {
  PORT: process.env.PORT || 3000,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'changeme',
  SESSION_SECRET: process.env.SESSION_SECRET || 'default',
  DB: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'maya_user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'maya_calendar',
    charset: 'utf8mb4'
  },
  EMAIL: {
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: { user: '', pass: '' }
  },
  SITE_URL: process.env.SITE_URL || 'https://maya-calendar.ru',
  SESSION_TTL: 2 * 60 * 60 * 1000,
  MAX_LOGIN_ATTEMPTS: 5,
  BLOCK_TIME: 15 * 60 * 1000,
  YOOKASSA: {
    shopId: process.env.YOOKASSA_SHOP_ID,
    secretKey: process.env.YOOKASSA_SECRET_KEY
  }
};
