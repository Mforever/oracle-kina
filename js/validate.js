window.Oracle = window.Oracle || {};

Oracle.validate = {
  date: function (dateStr) {
    const parts = dateStr.split(".");
    if (parts.length !== 3) return false;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      year < 1900 ||
      year > 2026
    )
      return false;
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  },
  email: function (email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
};

// Маска для поля даты
(function initDateMask() {
  const input = document.getElementById("birthDate");
  if (!input) return;

  input.addEventListener("input", function (e) {
    let value = input.value.replace(/\D/g, ""); // Оставляем только цифры
    if (value.length > 8) value = value.slice(0, 8); // Максимум 8 цифр

    // Форматируем как ДД.ММ.ГГГГ
    let formatted = "";
    if (value.length > 0) formatted += value.slice(0, 2);
    if (value.length > 2) formatted += "." + value.slice(2, 4);
    if (value.length > 4) formatted += "." + value.slice(4, 8);

    input.value = formatted;
  });

  input.addEventListener("keydown", function (e) {
    // Разрешаем: Backspace, Delete, стрелки, Tab, Enter
    const allowed = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Enter",
    ];
    if (allowed.includes(e.key)) return;
    // Блокируем всё, кроме цифр
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  });

  // Не даём вставить не-цифры
  input.addEventListener("paste", function (e) {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    const digits = pasted.replace(/\D/g, "").slice(0, 8);
    let formatted = "";
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += "." + digits.slice(2, 4);
    if (digits.length > 4) formatted += "." + digits.slice(4, 8);
    input.value = formatted;
  });
})();
