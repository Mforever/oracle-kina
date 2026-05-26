window.Oracle = window.Oracle || {};

Oracle.payment = (function () {
  const $ = (id) => document.getElementById(id);
  const form = $("modalPayForm");
  const emailInput = $("modalUserEmail");
  const btn = $("modalPayBtn");
  const msg = $("modalMessageBox");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
      showError("Введи email");
      return;
    }
    if (!Oracle.validate.email(email)) {
      showError("Некорректный email");
      return;
    }
    if (!Oracle.state.currentDate) {
      showError("Сначала открой свой знак");
      return;
    }

    btn.textContent = "Создаём платёж...";
    btn.disabled = true;
    msg.className = "modal-message";

    Oracle.api
      .createPayment(email, Oracle.state.currentDate)
      .then((data) => {
        console.log("Ответ от сервера:", data); // Отладка
        if (data.success && data.paymentUrl) {
          // Сохраняем данные для страницы Оракула
          sessionStorage.setItem(
            "oracleData",
            JSON.stringify({
              fullText: data.fullText || "",
              mayanName: data.mayanName || "",
              glyph: data.glyph || "",
              email: email,
              date: Oracle.state.currentDate,
            }),
          );
          // Редиректим на ЮKassa
          window.location.href = data.paymentUrl;
        } else {
          showError(data.error || "Ошибка создания платежа");
          btn.textContent = "Получить на почту";
          btn.disabled = false;
        }
      })
      .catch((err) => {
        console.error("Ошибка:", err);
        showError("Сервер недоступен");
        btn.textContent = "Получить на почту";
        btn.disabled = false;
      });
  });

  function showError(text) {
    msg.textContent = text;
    msg.className = "modal-message error";
  }
})();
