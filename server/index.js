const http = require("http");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const sessions = require("./sessions");
const { signRoute } = require("./routes/sign");
const { paymentRoute } = require("./routes/payment");
const { subscribeRoute } = require("./routes/subscribe");

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

  // ===== АДМИНКА: ЛОГИН =====
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

  // ===== АДМИНКА: ПРОВЕРКА СЕССИИ =====
  if (pathname === "/api/admin/check-session" && req.method === "GET") {
    const valid = checkAdmin(req);
    res.writeHead(valid ? 200 : 401, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify({ valid }));
    return;
  }

  // ===== АДМИНКА: ВЫХОД =====
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

  // ===== АДМИНКА: ЗНАКИ (список) =====
  if (
    pathname === "/api/admin/signs" &&
    req.method === "GET" &&
    checkAdmin(req)
  ) {
    try {
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, "..", "scripts", "maya_260_v2.json"),
          "utf-8",
        ),
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
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end("[]");
    }
    return;
  }

  // ===== АДМИНКА: ЗНАК (один + обновление) =====
  if (pathname.startsWith("/api/admin/sign/") && checkAdmin(req)) {
    const id = parseInt(pathname.split("/").pop());
    const filePath = path.join(__dirname, "..", "scripts", "maya_260_v2.json");

    if (req.method === "GET") {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const item = data.find((s) => s.id === id) || {};
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(JSON.stringify(item));
      } catch (e) {
        res.writeHead(500, {
          "Content-Type": "application/json; charset=utf-8",
        });
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
          const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const item = data.find((s) => s.id === id);
          if (item) {
            if (update.short_text !== undefined)
              item.short_text = update.short_text;
            if (update.full_text !== undefined)
              item.full_text = update.full_text;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
          }
          res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
    return;
  }

  // ===== АДМИНКА: КОМБИНАЦИИ (список) =====
  if (
    pathname === "/api/admin/combos" &&
    req.method === "GET" &&
    checkAdmin(req)
  ) {
    try {
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, "..", "scripts", "zodiac_combos_260_v2.json"),
          "utf-8",
        ),
      );
      const list = data.map((item) => ({
        id: item.id,
        title: item.title,
        short_text: item.short_text,
        full_text: item.full_text,
      }));
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(list));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end("[]");
    }
    return;
  }

  // ===== АДМИНКА: КОМБИНАЦИЯ (одна + обновление) =====
  if (pathname.startsWith("/api/admin/combo/") && checkAdmin(req)) {
    const id = parseInt(pathname.split("/").pop());
    const filePath = path.join(
      __dirname,
      "..",
      "scripts",
      "zodiac_combos_260_v2.json",
    );

    if (req.method === "GET") {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const item = data.find((s) => s.id === id) || {};
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(JSON.stringify(item));
      } catch (e) {
        res.writeHead(500, {
          "Content-Type": "application/json; charset=utf-8",
        });
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
          const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const item = data.find((s) => s.id === id);
          if (item) {
            if (update.short_text !== undefined)
              item.short_text = update.short_text;
            if (update.full_text !== undefined)
              item.full_text = update.full_text;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
          }
          res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
    return;
  }

  // ===== АДМИНКА: ПОДПИСЧИКИ =====
  if (
    pathname === "/api/admin/subscribers" &&
    req.method === "GET" &&
    checkAdmin(req)
  ) {
    try {
      const p = path.join(__dirname, "..", "subscribers.json");
      const data = fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "[]";
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(data);
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end("[]");
    }
    return;
  }

  // ===== АДМИНКА: ЗАКАЗЫ =====
  if (
    pathname === "/api/admin/orders" &&
    req.method === "GET" &&
    checkAdmin(req)
  ) {
    try {
      const p = path.join(__dirname, "..", "orders.json");
      const data = fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "[]";
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(data);
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end("[]");
    }
    return;
  }

  // ===== СТАТИКА =====
  let filePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");

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

  const ext = path.extname(filePath);
  const contentType = extMap[ext] || "text/plain; charset=utf-8";

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch {
    try {
      const content = fs.readFileSync("index.html", "utf-8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(content);
    } catch {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>404 Not Found</h1>");
    }
  }
});

server.listen(config.PORT, () => {
  console.log("═".repeat(50));
  console.log(`🌎 Сервер: http://localhost:${config.PORT}`);
  console.log("═".repeat(50));
});
