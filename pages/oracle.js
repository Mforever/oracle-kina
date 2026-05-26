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

  const urlParams = new URLSearchParams(window.location.search);
  const isPaymentSuccess = urlParams.get("payment") === "success";

  let rawData = sessionStorage.getItem("oracleData");

  if (isPaymentSuccess && !rawData) {
    rawData = localStorage.getItem("lastOracleData");
  }

  if (!rawData && !isPaymentSuccess) {
    const content = document.getElementById("oracleContent");
    if (content) {
      content.innerHTML = `
        <div style="text-align:center; padding:60px 20px;">
          <p style="font-size:48px; margin-bottom:20px;">🔒</p>
          <h2 style="color:var(--gold); font-family:'Cinzel',serif; margin-bottom:16px;">Доступ только после оплаты</h2>
          <p style="color:var(--text2); margin-bottom:28px;">Вернись на главную, введи дату рождения и получи свой Оракул.</p>
          <a href="/" style="display:inline-block; background:var(--gold); color:#0a0a0f; padding:14px 32px; border-radius:12px; text-decoration:none; font-weight:bold; font-family:'Cinzel',serif;">На главную</a>
        </div>`;
    }
    return;
  }

  if (!rawData) {
    const content = document.getElementById("oracleContent");
    if (content) {
      content.innerHTML =
        '<p style="text-align:center;color:var(--text2);padding:40px;">Данные не найдены. Вернись на главную и попробуй снова.</p>';
    }
    return;
  }

  const oracleData = JSON.parse(rawData);

  if (isPaymentSuccess) {
    localStorage.setItem("lastOracleData", rawData);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  function parseOracle(fullText) {
    const data = {
      totem: "",
      stone: "",
      color: "",
      powerMonth: "",
      dangerMonth: "",
      advice: "",
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
  const imgBase = "../images/";
  const name = oracleData.mayanName || "Твой знак";
  const glyph = oracleData.glyph || "🔮";

  document.getElementById("oracleGlyph").textContent = glyph;
  document.getElementById("oracleName").textContent = name;

  let html = "";

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
        "<p>Подобно змее, ты проходишь через множество трансформаций. Ты — целитель, чья мудрость приходит через понимание циклов жизни.</p>";
    else if (parsed.totem.includes("ветер") || parsed.totem.includes("ик"))
      html +=
        "<p>Ты — неукротимый ветер перемен. Твоя сила в слове и общении. Неси новые идеи, но помни: даже лёгкий бриз способен создать бурю.</p>";
    else
      html +=
        "<p>Твой дух-хранитель — древняя сила, источник твоей внутренней мощи. Ты обладаешь уникальной способностью влиять на мир вокруг себя.</p>";
  }
  html += "</div></div>";

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
      "<p>Носи его ближе к телу в важные дни, медитируй с ним, и он впитает все тревоги, наполняя спокойствием и уверенностью.</p>";
  }
  html += "</div></div>";

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
      "<p>Окружи себя этим цветом: добавь его в одежду, аксессуары или интерьер. Он будет работать как маяк, притягивая нужные события.</p>";
  }
  html += "</div></div>";

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
      "<p>В этот период твоя энергия будет на пике. Запускай проекты, назначай важные встречи. Вселенная будет открывать перед тобой двери.</p>";
  }
  html += "</div></div>";

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
      "<p>В этот период не принимай поспешных решений. Посвяти время планированию, отдыху и восстановлению.</p>";
  }
  html += "</div></div>";

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
      "<p>Одна фраза, которая изменит твой 2026. Пусть эта мудрость будет твоим путеводным светом.</p>";
  }
  html += "</div></div>";

  html += '<div class="oracle-final">';
  html += "<p>Помни: ты — часть великого цикла времени.</p>";
  html += "<p>Твоя судьба — в твоих руках.</p>";
  html += "<p>Пусть древняя мудрость освещает твой путь.</p>";
  html += "</div>";

  document.getElementById("oracleContent").innerHTML = html;

      // Кнопка PDF
  const pdfBtn = document.getElementById('pdfBtn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      pdfBtn.textContent = '⏳ Создаём PDF...';
      pdfBtn.disabled = true;
      
      const sections = document.querySelectorAll('.oracle-section, .oracle-final');
      let contentHTML = '';
      sections.forEach(s => contentHTML += s.outerHTML);
      
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '800px';
      iframe.style.height = 'auto';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              background: #111118; 
              color: #e8e6e3; 
              font-family: 'Inter', -apple-system, sans-serif; 
              line-height: 1.7;
              padding: 40px;
            }
            h3 { 
              font-family: 'Cinzel', serif; 
              font-size: 18px; 
              color: #c9a050; 
              margin-bottom: 12px; 
              letter-spacing: 2px; 
            }
            p { 
              font-size: 15px; 
              color: #9a9790; 
              margin-bottom: 8px; 
            }
            strong { color: #e8e6e3; font-weight: 600; }
            .oracle-advice { 
              font-style: italic; 
              font-size: 18px; 
              color: #e8e6e3; 
              margin: 16px 0; 
              padding-left: 20px; 
              border-left: 2px solid #c9a050; 
            }
            .oracle-section { 
              display: flex; 
              gap: 18px; 
              align-items: flex-start; 
              margin-bottom: 24px; 
              padding-bottom: 20px; 
              border-bottom: 1px solid #222230; 
            }
            .oracle-section-icon { 
              width: 56px; 
              height: 56px; 
              min-width: 56px;
              max-width: 56px;
              border-radius: 14px; 
              overflow: hidden; 
              flex-shrink: 0; 
            }
            .oracle-section-icon img { 
              width: 56px !important; 
              height: 56px !important; 
              object-fit: cover; 
              display: block; 
            }
            .oracle-final { 
              margin-top: 32px; 
              padding: 24px; 
              background: rgba(201, 160, 80, 0.08); 
              border: 1px solid rgba(201, 160, 80, 0.25); 
              border-radius: 20px; 
              text-align: center; 
            }
            .oracle-final p { 
              font-family: 'Cinzel', serif; 
              font-size: 16px; 
              color: #c9a050; 
              letter-spacing: 2px; 
              margin-bottom: 8px; 
            }
          </style>
        </head>
        <body>
          <h2 style="text-align:center; font-family:'Cinzel',serif; color:#c9a050; margin-bottom:28px; font-size:24px; letter-spacing:3px;">ПОЛНЫЙ ОРАКУЛ КИНА</h2>
          ${contentHTML}
        </body>
        </html>
      `);
      iframeDoc.close();
      
      setTimeout(async () => {
        try {
          const body = iframeDoc.body;
          const canvas = await html2canvas(body, {
            backgroundColor: '#111118',
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: 800,
            windowHeight: body.scrollHeight
          });
          
          document.body.removeChild(iframe);
          
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          const imgWidth = 190;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (imgHeight > 277) {
            let remainingHeight = canvas.height;
            let yOffset = 0;
            let firstPage = true;
            
            while (remainingHeight > 0) {
              const sliceHeight = Math.min(remainingHeight, Math.floor((277 / imgHeight) * canvas.height));
              const sliceCanvas = document.createElement('canvas');
              sliceCanvas.width = canvas.width;
              sliceCanvas.height = sliceHeight;
              const sliceCtx = sliceCanvas.getContext('2d');
              
              sliceCtx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
              
              const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
              const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width;
              
              if (firstPage) {
                pdf.addImage(sliceData, 'JPEG', 10, 15, imgWidth, sliceImgHeight);
                firstPage = false;
              } else {
                pdf.addPage();
                pdf.addImage(sliceData, 'JPEG', 10, 15, imgWidth, sliceImgHeight);
              }
              
              yOffset += sliceHeight;
              remainingHeight -= sliceHeight;
            }
          } else {
            pdf.addImage(imgData, 'JPEG', 10, 15, imgWidth, imgHeight);
          }
          
          pdf.save('orakul-kina-' + (name || 'goroskop') + '.pdf');
          
          pdfBtn.textContent = '📄 Скачать PDF';
          pdfBtn.disabled = false;
        } catch (err) {
          console.error('Ошибка PDF:', err);
          if (iframe.parentNode) document.body.removeChild(iframe);
          pdfBtn.textContent = '📄 Скачать PDF';
          pdfBtn.disabled = false;
        }
      }, 1500);
    });
  }

  // Кнопка Поделиться
  const shareBtn = document.getElementById("shareBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const shareText =
        "Мой знак в календаре Майя — " +
        name +
        ". Узнай свой на maya-calendar.ru";
      const shareUrl =
        window.location.origin +
        "/?date=" +
        encodeURIComponent(oracleData.date || "");

      if (navigator.share) {
        try {
          await navigator.share({
            title: "Оракул Кина — твой знак Майя",
            text: shareText,
            url: shareUrl,
          });
        } catch (err) {}
      } else {
        const fullText = shareText + " " + shareUrl;
        await navigator.clipboard.writeText(fullText);
        alert("Ссылка скопирована! Отправь другу.");
      }
    });
  }
})();
