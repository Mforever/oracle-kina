const http = require("http");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const sessions = require("./sessions");
const { signRoute } = require("./routes/sign");
const { paymentRoute } = require("./routes/payment");
const { subscribeRoute } = require("./routes/subscribe");
const { resendRoute } = require("./routes/resend");

// Корень проекта (родительская директория server/)
const PROJECT_ROOT = path.join(__dirname, "..");

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = {};
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.trim().split("=");
    if (parts.length === 2) cookies[parts[0].trim()] = parts[1].trim();
  });
  return cookies;
}

function checkAdmin(req) {
  const token = parseCookies(req).admin_token;
  return token && sessions.validateSession(token);
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${config.PORT}`);
  const pathname = parsedUrl.pathname;

  // ===== API =====
  if (pathname === "/api/sign" && req.method === "GET") {
    const date = parsedUrl.searchParams.get("date");
    signRoute(req, res, date);
    return;
  }

  if (pathname === "/api/payment" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => paymentRoute(req, res, body));
    return;
  }

  if (
    (pathname === "/api/subscribe" || pathname === "/api/subscribe-and-send") &&
    req.method === "POST"
  ) {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => subscribeRoute(req, res, body));
    return;
  }

  if (pathname === "/api/resend" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => resendRoute(req, res, body));
    return;
  }

  // ===== АДМИНКА =====
  if (pathname === "/api/admin/login" && req.method === "POST") {
    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const attempt = sessions.checkLoginAttempt(ip);
    if (!attempt.allowed) {
      res.writeHead(429, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: false, error: attempt.reason }));
      return;
    }
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const { password } = JSON.parse(body);
        if (password === config.ADMIN_PASSWORD) {
          sessions.resetAttempts(ip);
          const token = sessions.createSession();
          res.setHeader(
            "Set-Cookie",
            `admin_token=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${config.SESSION_TTL / 1000}`,
          );
          res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(JSON.stringify({ success: true }));
        } else {
          sessions.recordFailedAttempt(ip);
          res.writeHead(401, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(JSON.stringify({ success: false, error: "Неверный пароль" }));
        }
      } catch (e) {
        res.writeHead(400, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(JSON.stringify({ success: false, error: "Неверный формат" }));
      }
    });
    return;
  }

  if (pathname === "/api/admin/check-session" && req.method === "GET") {
    const valid = checkAdmin(req);
    res.writeHead(valid ? 200 : 401, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify({ valid }));
    return;
  }

  if (pathname === "/api/admin/logout" && req.method === "POST") {
    const token = parseCookies(req).admin_token;
    if (token) sessions.destroySession(token);
    res.setHeader(
      "Set-Cookie",
      "admin_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
    );
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // ===== АДМИНКА: ЗНАКИ =====
  if (pathname === "/api/admin/signs" && req.method === "GET" && checkAdmin(req)) {
    try {
      const data = JSON.parse(
        fs.readFileSync(path.join(PROJECT_ROOT, "scripts", "maya_260_v2.json"), "utf-8")
      );
      const list = data.map((item) => ({
        id: item.id,
        name_ru: item.name_ru,
        glyph_emoji: item.glyph_emoji,
        short_text: item.short_text,
        full_text: item.full_text,
      }));
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(list));
    } catch (e) {
      res.writeHead(500);
      res.end("[]");
    }
    return;
  }

  if (pathname.startsWith("/api/admin/sign/") && checkAdmin(req)) {
    const id = parseInt(pathname.split("/").pop());
    const fp = path.join(PROJECT_ROOT, "scripts", "maya_260_v2.json");
    if (req.method === "GET") {
      try {
        const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(data.find((s) => s.id === id) || {}));
      } catch (e) {
        res.writeHead(500);
        res.end("{}");
      }
      return;
    }
    if (req.method === "PUT") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        try {
          const update = JSON.parse(body);
          if (typeof update.short_text === "string" && update.short_text.length > 2000) {
            res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ success: false, error: "Текст слишком длинный" }));
            return;
          }
          if (typeof update.full_text === "string" && update.full_text.length > 10000) {
            res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ success: false, error: "Текст слишком длинный" }));
            return;
          }
          const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
          const item = data.find((s) => s.id === id);
          if (item) {
            if (update.short_text !== undefined) item.short_text = update.short_text;
            if (update.full_text !== undefined) item.full_text = update.full_text;
            fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8");
          }
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
    return;
  }

  // ===== АДМИНКА: КОМБО =====
  if (pathname === "/api/admin/combos" && req.method === "GET" && checkAdmin(req)) {
    try {
      const data = JSON.parse(
        fs.readFileSync(path.join(PROJECT_ROOT, "scripts", "zodiac_combos_260_v2.json"), "utf-8")
      );
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(data.map((item) => ({
        id: item.id,
        title: item.title,
        short_text: item.short_text,
        full_text: item.full_text,
      }))));
    } catch (e) {
      res.writeHead(500);
      res.end("[]");
    }
    return;
  }

  if (pathname.startsWith("/api/admin/combo/") && checkAdmin(req)) {
    const id = parseInt(pathname.split("/").pop());
    const fp = path.join(PROJECT_ROOT, "scripts", "zodiac_combos_260_v2.json");
    if (req.method === "GET") {
      try {
        const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(data.find((s) => s.id === id) || {}));
      } catch (e) {
        res.writeHead(500);
        res.end("{}");
      }
      return;
    }
    if (req.method === "PUT") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        try {
          const update = JSON.parse(body);
          if (typeof update.short_text === "string" && update.short_text.length > 2000) {
            res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ success: false, error: "Текст слишком длинный" }));
            return;
          }
          if (typeof update.full_text === "string" && update.full_text.length > 10000) {
            res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ success: false, error: "Текст слишком длинный" }));
            return;
          }
          const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
          const item = data.find((s) => s.id === id);
          if (item) {
            if (update.short_text !== undefined) item.short_text = update.short_text;
            if (update.full_text !== undefined) item.full_text = update.full_text;
            fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8");
          }
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
    return;
  }

  // ===== АДМИНКА: ПОДПИСЧИКИ =====
  if (pathname === "/api/admin/subscribers" && req.method === "GET" && checkAdmin(req)) {
    try {
      const p = path.join(PROJECT_ROOT, "subscribers.json");
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "[]");
    } catch (e) {
      res.writeHead(500);
      res.end("[]");
    }
    return;
  }

  // ===== АДМИНКА: ЗАКАЗЫ =====
  if (pathname === "/api/admin/orders" && req.method === "GET" && checkAdmin(req)) {
    try {
      const p = path.join(PROJECT_ROOT, "orders.json");
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "[]");
    } catch (e) {
      res.writeHead(500);
      res.end("[]");
    }
    return;
  }

  if (pathname === "/api/admin/update-price" && req.method === "POST" && checkAdmin(req)) {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const { price } = JSON.parse(body);
        const modalPath = path.join(PROJECT_ROOT, "js", "modal.js");
        let content = fs.readFileSync(modalPath, "utf-8");
        content = content.replace(/\d+ ₽/, price + " ₽");
        fs.writeFileSync(modalPath, content, "utf-8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // ===== СТАТИКА (ИСПРАВЛЕНО: Path Traversal + доступ к корню проекта) =====
  const extMap = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };

  let rawPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let safePath = path.normalize(rawPath).replace(/^(\.\.(\/|\\|$))+/, "");
  let fullPath = path.join(PROJECT_ROOT, safePath);

  // Защита: запрещаем выход за пределы PROJECT_ROOT
  if (!fullPath.startsWith(PROJECT_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const ext = path.extname(fullPath);
  const contentType = extMap[ext] || "text/plain; charset=utf-8";

  fs.readFile(fullPath, (err, content) => {
    if (!err) {
      if (!res.headersSent) {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      }
    } else {
      // Fallback на index.html
      const indexPath = path.join(PROJECT_ROOT, "index.html");
      fs.readFile(indexPath, (err2, indexContent) => {
        if (!err2 && !res.headersSent) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(indexContent);
        } else if (!res.headersSent) {
          res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h1>404</h1>");
        }
      });
    }
  });
});

server.listen(config.PORT, () => {
  console.log("═".repeat(50));
  console.log(`🌎 Сервер: http://localhost:${config.PORT}`);
  console.log("═".repeat(50));
});
