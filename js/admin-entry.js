(function () {
  const brand = document.getElementById("footerBrand");
  const overlay = document.getElementById("adminLoginOverlay");
  const closeBtn = document.getElementById("adminLoginClose");
  const form = document.getElementById("adminLoginForm");
  const passInput = document.getElementById("adminPassword");
  const msg = document.getElementById("adminLoginMessage");

  if (!brand || !overlay) return;

  let clicks = 0,
    timer = null;

  brand.addEventListener("click", () => {
    clicks++;
    if (timer) clearTimeout(timer);
    if (clicks >= 5) {
      clicks = 0;
      open();
    }
    timer = setTimeout(() => (clicks = 0), 2000);
  });

  function open() {
    overlay.classList.add("active");
    document.body.classList.add("no-scroll");
    passInput.value = "";
    msg.className = "modal-message";
    msg.textContent = "";
    passInput.focus();
  }

  function close() {
    overlay.classList.remove("active");
    document.body.classList.remove("no-scroll");
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("active")) close();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pass = passInput.value.trim();
    if (!pass) return;
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass }),
    });
    const data = await res.json();
    if (data.success) {
      msg.textContent = "✅ Вход выполнен";
      msg.className = "modal-message success";
      setTimeout(() => (window.location.href = "admin/admin.html"), 500);
    } else {
      msg.textContent = data.error || "Неверный пароль";
      msg.className = "modal-message error";
    }
  });
})();
