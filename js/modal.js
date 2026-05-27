window.Oracle = window.Oracle || {};

Oracle.modal = (function () {
  const $ = (id) => document.getElementById(id);

  const overlay = $("modalOverlay");
  const closeBtn = $("modalClose");
  const glyph = $("modalGlyph");
  const name = $("modalSignName");
  const subtitle = $("modalSignSubtitle");
  const text = $("modalTypedText");
  const offer = $("modalOfferBlock");

  function open() {
    overlay.classList.add("active");
    document.body.classList.add("no-scroll");
    // Восстанавливаем стандартный вид offer-блока
    offer.innerHTML = `
      <p class="modal-offer-title">Узнай свою судьбу на год<br>по цене чашки кофе</p>
      <p class="modal-price-new">299 ₽</p>
      <form class="modal-form" id="modalPayForm">
        <input type="email" id="modalUserEmail" placeholder="Твой email" autocomplete="off">
        <button type="submit" class="btn-primary" id="modalPayBtn">Получить на почту</button>
      </form>
      <p class="modal-message" id="modalMessageBox" role="status"></p>
      <p class="modal-guarantee">Оплата через ЮKassa &middot; Мгновенная доставка &middot; Доступ навсегда</p>
    `;
    name.textContent = "";
    subtitle.textContent = "";
    text.textContent = "";
    offer.classList.remove("visible");
  }

  function close() {
    overlay.classList.remove("active");
    document.body.classList.remove("no-scroll");
  }

  function showResult(data) {
    if (!data || !data.mayan) {
      name.textContent = "Знак не найден";
      text.textContent = "Проверь дату рождения и попробуй снова.";
      return;
    }
    const m = data.mayan;
    name.textContent = m.name_ru || "";
    const sub = [];
    if (m.name_original) sub.push(m.name_original);
    if (m.id) sub.push("Кин " + m.id);
    subtitle.textContent = sub.join(" · ");
    text.textContent = m.short_text || "";

    if (data.alreadyPaid) {
      offer.innerHTML = `
        <p class="modal-offer-title">Этот гороскоп уже оплачен</p>
        <a href="pages/oracle.html?payment=success" class="btn-primary">Открыть Оракул →</a>
        <p class="modal-guarantee" style="margin-top:16px;">
          <a href="#" id="resendLink" style="color:var(--gold); text-decoration:underline;">Отправить на почту повторно</a>
        </p>
      `;
      offer.classList.add("visible");

      // Повторная отправка
      setTimeout(() => {
        const resendLink = document.getElementById("resendLink");
        if (resendLink) {
          resendLink.addEventListener("click", function (e) {
            e.preventDefault();
            const saved = JSON.parse(
              localStorage.getItem("oracleData") || "{}",
            );
            const email = saved.email || prompt("Введи email для отправки:");
            if (email && Oracle.state.currentDate) {
              Oracle.api
                .createPayment(email, Oracle.state.currentDate)
                .then(() => {
                  alert("Гороскоп отправлен на " + email);
                });
            }
          });
        }
      }, 100);
    } else {
      setTimeout(() => offer.classList.add("visible"), 500);
    }
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("active")) close();
  });

  return { open, close, showResult };
})();
