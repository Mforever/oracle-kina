(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const birthDate = $("birthDate");
  const calcBtn = $("calcBtn");
  const modalOverlay = $("modalOverlay");
  const modalClose = $("modalClose");
  const modalGlyph = $("modalGlyph");
  const modalSignName = $("modalSignName");
  const modalSignSubtitle = $("modalSignSubtitle");
  const modalTypedText = $("modalTypedText");
  const modalOfferBlock = $("modalOfferBlock");
  const modalUserEmail = $("modalUserEmail");
  const modalPayBtn = $("modalPayBtn");
  const modalMessageBox = $("modalMessageBox");
  const modalPayForm = $("modalPayForm");

  let currentDate = "";

  // Stars
  (function () {
    const c = $("stars");
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

  // Modal
  function openModal() {
    modalOverlay.classList.add("active");
    document.body.classList.add("no-scroll");
    modalGlyph.innerHTML =
      '<img src="images/hero-mask.jpg" alt="Маска майя" style="width:80px;height:80px;border-radius:50%;object-fit:cover;box-shadow: 0 0 30px rgba(201,160,80,0.3);">';
    modalSignName.textContent = "";
    modalSignSubtitle.textContent = "";
    modalTypedText.textContent = "";
    modalTypedText.style.opacity = "1";
    modalOfferBlock.classList.remove("visible");
    modalOfferBlock.style.display = "";
    modalMessageBox.className = "modal-message";
    modalMessageBox.textContent = "";
    modalMessageBox.style.display = "";
    modalUserEmail.value = "";
    modalPayBtn.textContent = "Получить на почту";
    modalPayBtn.style.background = "";
    modalPayBtn.style.color = "";
    modalPayBtn.disabled = false;
  }

  function closeModal() {
    modalOverlay.classList.remove("active");
    document.body.classList.remove("no-scroll");
  }

  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  function isValidDate(dateStr) {
    const parts = dateStr.split(".");
    if (parts.length !== 3) return false;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2026) return false;
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showResult(data) {
    modalSignName.textContent = "";
    modalSignSubtitle.textContent = "";
    modalTypedText.textContent = "";
    modalOfferBlock.classList.remove("visible");
    modalMessageBox.className = "modal-message";
    modalMessageBox.textContent = "";

    if (!data || !data.mayan) {
      modalSignName.textContent = "Знак не найден";
      modalTypedText.textContent = "Проверь дату рождения и попробуй снова.";
      return;
    }

    const m = data.mayan;
    modalSignName.textContent = m.name_ru || "Неизвестный знак";

    const sub = [];
    if (m.name_original) sub.push(m.name_original);
    if (m.id) sub.push("Кин " + m.id);
    modalSignSubtitle.textContent = sub.join(" · ");

    modalTypedText.textContent =
      m.short_text || "Древний календарь хранит твою тайну.";

    setTimeout(() => {
      modalOfferBlock.classList.add("visible");
    }, 500);
  }

      function handleCalc() {
        const d = birthDate.value.trim();

        if (!d) {
          alert("Введи дату рождения в формате ДД.ММ.ГГГГ");
          return;
        }
        if (!isValidDate(d)) {
          alert("Некорректная дата. Введи реальную дату.");
          return;
        }
        currentDate = d;

        // Проверяем, есть ли уже оплаченный Оракул для этой даты
        const savedOracle = sessionStorage.getItem("oracleData");
        if (savedOracle) {
          try {
            const saved = JSON.parse(savedOracle);
            if (saved.date === d) {
              window.location.href = "oracle.html";
              return;
            }
          } catch (e) {}
        }

        sessionStorage.removeItem("oracleData");
        openModal();
        fetch("/api/sign?date=" + encodeURIComponent(d))
          .then((r) => r.json())
          .then((data) => showResult(data))
          .catch(() => {
            modalSignName.textContent = "Ошибка";
            modalTypedText.textContent = "Не удалось загрузить данные.";
          });
      }

  calcBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleCalc();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modalOverlay.classList.contains("active")) {
        closeModal();
        return;
      }
      const adminOverlay = document.getElementById("adminLoginOverlay");
      if (adminOverlay && adminOverlay.classList.contains("active")) {
        adminOverlay.classList.remove("active");
        document.body.classList.remove("no-scroll");
        return;
      }
    }
  });

  birthDate.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCalc();
    }
  });

    modalPayForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = modalUserEmail.value.trim();
      if (!email) {
        modalMessageBox.textContent = "Введи email";
        modalMessageBox.className = "modal-message error";
        return;
      }
      if (!isValidEmail(email)) {
        modalMessageBox.textContent = "Некорректный email";
        modalMessageBox.className = "modal-message error";
        return;
      }
      if (!currentDate) {
        modalMessageBox.textContent = "Сначала открой свой знак";
        modalMessageBox.className = "modal-message error";
        return;
      }

      modalPayBtn.textContent = "Создаём платёж...";
      modalPayBtn.disabled = true;
      modalMessageBox.className = "modal-message";

      fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, date: currentDate }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            sessionStorage.setItem(
              "oracleData",
              JSON.stringify({
                fullText: data.fullText || "",
                mayanName: data.mayanName || "",
                glyph: data.glyph || "",
                email: email,
                date: currentDate,
              }),
            );
            window.location.href = "oracle.html";
          } else {
            modalMessageBox.textContent = data.error || "Ошибка";
            modalMessageBox.className = "modal-message error";
            modalPayBtn.textContent = "Получить на почту";
            modalPayBtn.disabled = false;
          }
        })
        .catch(() => {
          modalMessageBox.textContent = "Сервер недоступен";
          modalMessageBox.className = "modal-message error";
          modalPayBtn.textContent = "Получить на почту";
          modalPayBtn.disabled = false;
        });
    });

  // ===== СКРЫТЫЙ ВХОД В АДМИНКУ =====
  (function initAdminEntry() {
    const brand = document.getElementById("footerBrand");
    const adminOverlay = document.getElementById("adminLoginOverlay");
    const adminClose = document.getElementById("adminLoginClose");
    const adminForm = document.getElementById("adminLoginForm");
    const adminPassword = document.getElementById("adminPassword");
    const adminMessage = document.getElementById("adminLoginMessage");

    if (!brand || !adminOverlay) return;

    let clickCount = 0;
    let clickTimer = null;

    brand.addEventListener("click", () => {
      clickCount++;
      if (clickTimer) clearTimeout(clickTimer);
      if (clickCount >= 5) {
        clickCount = 0;
        openAdminLogin();
      }
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 2000);
    });

    function openAdminLogin() {
      adminOverlay.classList.add("active");
      document.body.classList.add("no-scroll");
      adminPassword.value = "";
      adminMessage.className = "modal-message";
      adminMessage.textContent = "";
      adminPassword.focus();
    }

    function closeAdminLogin() {
      adminOverlay.classList.remove("active");
      document.body.classList.remove("no-scroll");
    }

    adminClose.addEventListener("click", closeAdminLogin);
    adminOverlay.addEventListener("click", (e) => {
      if (e.target === adminOverlay) closeAdminLogin();
    });

    adminForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = adminPassword.value.trim();
      if (!password) {
        adminMessage.textContent = "Введи пароль";
        adminMessage.className = "modal-message error";
        return;
      }

      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (data.success) {
          adminMessage.textContent = "✅ Вход выполнен";
          adminMessage.className = "modal-message success";
          setTimeout(() => {
            window.location.href = "admin.html";
          }, 500);
        } else {
          adminMessage.textContent = data.error || "Неверный пароль";
          adminMessage.className = "modal-message error";
        }
      } catch (err) {
        adminMessage.textContent = "Ошибка соединения";
        adminMessage.className = "modal-message error";
      }
    });
  })();
})();
