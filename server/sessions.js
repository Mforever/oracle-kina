const crypto = require("crypto");
const config = require("./config");

// Хранилище сессий в памяти (для продакшена — заменить на Redis или БД)
const sessions = new Map();
const loginAttempts = new Map(); // IP → { count, blockedUntil }

function generateToken() {
  return crypto.randomUUID();
}

function createSession() {
  const token = generateToken();
  const expiresAt = Date.now() + config.SESSION_TTL;
  sessions.set(token, { createdAt: Date.now(), expiresAt });
  return token;
}

function validateSession(token) {
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function destroySession(token) {
  sessions.delete(token);
}

// Защита от брутфорса
function checkLoginAttempt(ip) {
  const record = loginAttempts.get(ip);

  if (record && record.blockedUntil && Date.now() < record.blockedUntil) {
    const remaining = Math.ceil((record.blockedUntil - Date.now()) / 1000 / 60);
    return {
      allowed: false,
      reason: `Слишком много попыток. Попробуй через ${remaining} мин.`,
    };
  }

  return { allowed: true };
}

function recordFailedAttempt(ip) {
  const record = loginAttempts.get(ip) || { count: 0, blockedUntil: null };
  record.count++;

  if (record.count >= config.MAX_LOGIN_ATTEMPTS) {
    record.blockedUntil = Date.now() + config.BLOCK_TIME;
    record.count = 0;
  }

  loginAttempts.set(ip, record);
}

function resetAttempts(ip) {
  loginAttempts.delete(ip);
}

// Очистка старых сессий раз в час
setInterval(
  () => {
    const now = Date.now();
    for (const [token, session] of sessions) {
      if (now > session.expiresAt) {
        sessions.delete(token);
      }
    }
  },
  60 * 60 * 1000,
);

module.exports = {
  createSession,
  validateSession,
  destroySession,
  checkLoginAttempt,
  recordFailedAttempt,
  resetAttempts,
};
