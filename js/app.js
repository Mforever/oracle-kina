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
})();
