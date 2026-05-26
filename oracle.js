(function () {
  "use strict";

  // Stars
  (function () {
    const c = document.getElementById("stars");
    if (!c) return;
    for (let i = 0; i < 140; i++) {
      const s = document.createElement("div");
      s.className = "star";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      const sz = Math.random() * 2 + 0.6;
      s.style.width = sz + "px";
      s.style.height = sz + "px";
      s.style.setProperty("--duration", Math.random() * 5 + 3 + "s");
      s.style.setProperty("--delay", Math.random() * 8 + "s");
      c.appendChild(s);
    }
  })();

  const rawData = sessionStorage.getItem("oracleData");
  if (!rawData) {
    const content = document.getElementById("oracleContent");
    if (content) {
      content.innerHTML =
        '<p style="text-align:center; color: var(--text2); padding: 40px;">Данные не найдены. Вернись на главную и открой свой знак заново.</p>';
    }
    return;
  }

  const oracleData = JSON.parse(rawData);

  function parseOracle(fullText) {
    const data = {
      totem: "",
      stone: "",
      color: "",
      powerMonth: "",
      dangerMonth: "",
      advice: "",
      description: "",
    };
    const text = fullText || "";
    let m;
    m = text.match(/тотем\s*—\s*(.+?)[,.]/i);
    if (m) data.totem = m[1].trim();
    m =
      text.match(/камень-талисман\s*:\s*(.+?)[,.]/i) ||
      text.match(/камень\s*:\s*(.+?)[,.]/i);
    if (m) data.stone = m[1].trim();
    m = text.match(/цвет\s*(?:силы)?\s*:\s*(.+?)[,.]/i);
    if (m) data.color = m[1].trim();
    m = text.match(/месяц\s*(?:наибольшей\s*)?силы\s*—\s*(.+?)[,.]/i);
    if (m) data.powerMonth = m[1].trim();
    m = text.match(/внимательны\s*(?:в|во)\s+(.+?)\s*—/i);
    if (m) data.dangerMonth = m[1].trim();
    m = text.match(/совет\s*(?:года)?\s*:\s*(.+?)[,.]/i);
    if (m) data.advice = m[1].trim();
    return data;
  }

  const parsed = parseOracle(oracleData.fullText);
  const imgBase = "images/";
  const name = oracleData.mayanName || "Твой знак";
  const glyph = oracleData.glyph || "🔮";

  document.getElementById("oracleGlyph").textContent = glyph;
  document.getElementById("oracleName").textContent = name;

  let html = "";

  // 1. Тотемное животное
  html += '<div class="oracle-section">';
  html +=
    '<div class="oracle-section-icon"><img src="' +
    imgBase +
    'jaguar.jpg" alt="Тотемное животное"></div>';
  html += '<div class="oracle-section-body">';
  html += "<h3>Тотемное животное</h3>";
  if (parsed.totem) {
    html +=
      "<p>Твой дух-покровитель — <strong>" +
      parsed.totem +
      "</strong>. Дух-хранитель, который ведёт тебя по жизни.</p>";
    if (parsed.totem.includes("ягуар"))
      html +=
        "<p>Подобно ягуару, ты видишь в темноте то, что скрыто от других. Твоя интуиция — это твой компас. Ты прирожденный лидер, но предпочитаешь действовать из тени.</p>";
    else if (parsed.totem.includes("змея"))
      html +=
        "<p>Подобно змее, ты проходишь через множество трансформаций, сбрасывая старую кожу убеждений и страхов. Ты — целитель, чья мудрость приходит через глубокое понимание циклов жизни.</p>";
    else if (parsed.totem.includes("ветер") || parsed.totem.includes("ик"))
      html +=
        "<p>Ты — неукротимый ветер перемен. Твоя сила в слове и общении. Ты несешь новые идеи и вдохновение, но помни: даже легкий бриз способен создать бурю.</p>";
    else
      html +=
        "<p>Твой дух-хранитель — древняя сила, источник твоей внутренней мощи. Ты обладаешь уникальной способностью влиять на мир вокруг себя.</p>";
  }
  html += "</div></div>";

  // 2. Камень-талисман
  html += '<div class="oracle-section">';
  html +=
    '<div class="oracle-section-icon"><img src="' +
    imgBase +
    'gemstone.jpg" alt="Камень-талисман"></div>';
  html += '<div class="oracle-section-body">';
  html += "<h3>Камень-талисман</h3>";
  if (parsed.stone) {
    html +=
      "<p><strong>" +
      parsed.stone +
      "</strong> — твой камень-талисман на 2026 год. Он усилит твои природные способности.</p>";
    html +=
      "<p>Носи его ближе к телу в важные дни, медитируй с ним, и он впитает в себя все тревоги, наполняя тебя спокойствием и уверенностью.</p>";
  }
  html += "</div></div>";

  // 3. Цвет силы
  html += '<div class="oracle-section">';
  html +=
    '<div class="oracle-section-icon"><img src="' +
    imgBase +
    'textile.jpg" alt="Цвет силы"></div>';
  html += '<div class="oracle-section-body">';
  html += "<h3>Цвет силы</h3>";
  if (parsed.color) {
    html +=
      "<p><strong>" +
      parsed.color +
      "</strong> — твой цвет силы. Что носить в важные дни для притяжения удачи.</p>";
    html +=
      "<p>Окружи себя этим цветом: добавь его в одежду, аксессуары или интерьер. Он будет работать как маяк, притягивая к тебе нужные события.</p>";
  }
  html += "</div></div>";

  // 4. Месяц удачи
  html += '<div class="oracle-section">';
  html +=
    '<div class="oracle-section-icon"><img src="' +
    imgBase +
    'moon-pyramid.jpg" alt="Месяц удачи"></div>';
  html += '<div class="oracle-section-body">';
  html += "<h3>Месяц удачи</h3>";
  if (parsed.powerMonth) {
    html +=
      "<p><strong>" +
      parsed.powerMonth +
      "</strong> — твой месяц наибольшей силы. Когда начинать новое и принимать важные решения.</p>";
    html +=
      "<p>В этот период твоя энергия будет на пике. Запускай проекты, назначай важные встречи, делай предложения. Сама Вселенная будет открывать перед тобой двери.</p>";
  }
  html += "</div></div>";

  // 5. Опасный месяц
  html += '<div class="oracle-section">';
  html +=
    '<div class="oracle-section-icon"><img src="' +
    imgBase +
    'shield.jpg" alt="Опасный месяц"></div>';
  html += '<div class="oracle-section-body">';
  html += "<h3>Опасный месяц</h3>";
  if (parsed.dangerMonth) {
    html +=
      "<p><strong>" +
      parsed.dangerMonth +
      "</strong> — месяц осторожности. Когда быть внимательным и не рисковать.</p>";
    html +=
      "<p>В этот период не принимай поспешных решений и не ввязывайся в авантюры. Посвяти время планированию, отдыху и восстановлению.</p>";
  }
  html += "</div></div>";

  // 6. Совет года
  html += '<div class="oracle-section">';
  html +=
    '<div class="oracle-section-icon"><img src="' +
    imgBase +
    'codex.jpg" alt="Совет года"></div>';
  html += '<div class="oracle-section-body">';
  html += "<h3>Совет года</h3>";
  if (parsed.advice) {
    html += '<p class="oracle-advice">«' + parsed.advice + "»</p>";
    html +=
      "<p>Одна фраза, которая изменит твой 2026. Пусть эта мудрость будет твоим путеводным светом. Это ключ к твоей реализации и счастью.</p>";
  }
  html += "</div></div>";

  // Финальное напутствие
  html += '<div class="oracle-final">';
  html += "<p>Помни: ты — часть великого цикла времени.</p>";
  html += "<p>Твоя судьба — в твоих руках.</p>";
  html += "<p>Пусть древняя мудрость освещает твой путь.</p>";
  html += "</div>";

  document.getElementById("oracleContent").innerHTML = html;
})();
