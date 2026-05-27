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
        // Уже оплачено — показываем кнопку «Открыть Оракул»
        offer.innerHTML = `
        <p class="modal-offer-title">Этот гороскоп уже оплачен</p>
        <a href="pages/oracle.html" class="btn-primary">Открыть Оракул →</a>
      `;
        offer.classList.add("visible");
      } else {
        // Не оплачено — обычный блок оплаты
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
