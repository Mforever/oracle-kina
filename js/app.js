(function () {
  const $ = (id) => document.getElementById(id);
  const birthDate = $("birthDate");
  const calcBtn = $("calcBtn");

  window.Oracle.state = { currentDate: "" };

  function handleCalc() {
    const d = birthDate.value.trim();
    if (!d) return alert("Введи дату рождения в формате ДД.ММ.ГГГГ");
    if (!Oracle.validate.date(d)) return alert("Некорректная дата.");

    Oracle.state.currentDate = d;
    sessionStorage.removeItem("oracleData");

    const saved = sessionStorage.getItem("oracleData");
    if (saved) {
      try {
        if (JSON.parse(saved).date === d) {
          window.location.href = "pages/oracle.html";
          return;
        }
      } catch (e) {}
    }

    Oracle.modal.open();
    Oracle.api.fetchSign(d).then(Oracle.modal.showResult);
  }

  calcBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleCalc();
  });
  birthDate.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCalc();
    }
  });

    // Знак дня
  (function loadDailySign() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayStr = dd + '.' + mm + '.' + yyyy;
    
    Oracle.api.fetchSign(todayStr).then(data => {
      const card = document.getElementById('dailyCard');
      if (!card || !data || !data.mayan) return;
      
      card.innerHTML = `
        <div class="daily-glyph">${data.mayan.glyph_emoji || '🔮'}</div>
        <div class="daily-name">${data.mayan.name_ru}</div>
        <div class="daily-sub">${data.mayan.name_original} · Кин ${data.mayan.id}</div>
        <p class="daily-text">${data.mayan.short_text}</p>
        <a href="#top" class="btn-primary daily-btn">Узнать свой знак</a>
      `;
    });
  })();
})();
