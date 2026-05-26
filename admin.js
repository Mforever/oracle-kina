(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const loginScreen = $("loginScreen");
  const adminPanel = $("adminPanel");
  const loginBtn = $("loginBtn");
  const adminKeyInput = $("adminKey");
  const loginError = $("loginError");
  const logoutBtn = $("logoutBtn");

  // Проверяем, есть ли активная сессия
  checkSession();

  loginBtn.addEventListener("click", doLogin);
  adminKeyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });

  async function checkSession() {
    try {
      const res = await fetch("/api/admin/check-session");
      if (res.ok) {
        showPanel();
      }
    } catch (e) {
      // Нет сессии — показываем логин
    }
  }

  async function doLogin() {
    const password = adminKeyInput.value.trim();
    if (!password) {
      loginError.textContent = "Введи пароль";
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
        showPanel();
      } else {
        loginError.textContent = data.error || "Неверный пароль";
      }
    } catch (e) {
      loginError.textContent = "Ошибка соединения";
    }
  }

  function showPanel() {
    loginScreen.style.display = "none";
    adminPanel.style.display = "block";
    initPanel();
  }

  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  });

  function initPanel() {
    loadSigns();
    setupTabs();
    setupSettings();
  }

  // Вкладки
  function setupTabs() {
    const btns = document.querySelectorAll(".nav-btn");
    const tabs = document.querySelectorAll(".tab");

    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        btns.forEach((b) => b.classList.remove("active"));
        tabs.forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");
        const tabId = "tab-" + btn.dataset.tab;
        const tab = document.getElementById(tabId);
        if (tab) tab.classList.add("active");

        if (btn.dataset.tab === "signs") loadSigns();
        if (btn.dataset.tab === "combos") loadCombos();
        if (btn.dataset.tab === "subscribers") loadSubscribers();
        if (btn.dataset.tab === "orders") loadOrders();
      });
    });
  }

  // Знаки
  async function loadSigns() {
    const res = await fetch("/api/admin/signs");
    const data = await res.json();
    const container = $("signsList");
    const search = $("signSearch");

    function render(list) {
      container.innerHTML = list
        .map(
          (item) => `
        <div class="sign-item">
          <div class="info">
            <div class="name">${item.id}. ${item.name_ru} ${item.glyph_emoji || ""}</div>
            <div class="preview">${(item.short_text || "").substring(0, 120)}...</div>
          </div>
          <button class="edit-btn" data-id="${item.id}" data-type="sign">Редактировать</button>
        </div>
      `,
        )
        .join("");
      bindEditButtons();
    }

    render(data);
    search.addEventListener("input", () => {
      const q = search.value.toLowerCase();
      const filtered = data.filter((item) =>
        item.name_ru.toLowerCase().includes(q),
      );
      render(filtered);
    });
  }

  // Комбинации
  async function loadCombos() {
    const res = await fetch("/api/admin/combos");
    const data = await res.json();
    const container = $("combosList");
    const search = $("comboSearch");

    function render(list) {
      container.innerHTML = list
        .map(
          (item) => `
        <div class="combo-item">
          <div class="info">
            <div class="title">${item.id}. ${item.title}</div>
            <div class="preview">${(item.short_text || "").substring(0, 120)}...</div>
          </div>
          <button class="edit-btn" data-id="${item.id}" data-type="combo">Редактировать</button>
        </div>
      `,
        )
        .join("");
      bindEditButtons();
    }

    render(data);
    search.addEventListener("input", () => {
      const q = search.value.toLowerCase();
      const filtered = data.filter((item) =>
        item.title.toLowerCase().includes(q),
      );
      render(filtered);
    });
  }

  // Подписчики
  async function loadSubscribers() {
    const res = await fetch("/api/admin/subscribers");
    const data = await res.json();
    const tbody = $("subsTable");
    tbody.innerHTML = data
      .map((s) => `<tr><td>${s.email}</td><td>${s.date}</td></tr>`)
      .join("");
  }

  // Заказы
  async function loadOrders() {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    const tbody = $("ordersTable");
    tbody.innerHTML = data
      .map(
        (o) => `
      <tr>
        <td>${o.email}</td>
        <td>${o.date}</td>
        <td>${o.mayanName || "-"}</td>
        <td>${o.sentAt}</td>
      </tr>
    `,
      )
      .join("");
  }

  // Редактирование
  function bindEditButtons() {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const type = btn.dataset.type;
        const res = await fetch(`/api/admin/${type}/${id}`);
        const item = await res.json();
        openEditModal(item, type);
      });
    });
  }

  function openEditModal(item, type) {
    const modal = $("editModal");
    const title = $("editModalTitle");
    const shortText = $("editShortText");
    const fullText = $("editFullText");
    const saveBtn = $("saveEditBtn");
    const message = $("editMessage");

    title.textContent = type === "sign" ? item.name_ru : item.title;
    shortText.value = item.short_text || "";
    fullText.value = item.full_text || "";
    message.textContent = "";
    modal.classList.add("active");

    $("editModalClose").onclick = () => modal.classList.remove("active");
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove("active");
    };

    saveBtn.onclick = async () => {
      const res = await fetch(`/api/admin/${type}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          short_text: shortText.value,
          full_text: fullText.value,
        }),
      });
      const data = await res.json();
      message.textContent = data.success ? "✅ Сохранено" : "❌ Ошибка";
      message.className =
        "edit-message " + (data.success ? "success" : "error");
      if (data.success) {
        setTimeout(() => modal.classList.remove("active"), 800);
        if (type === "sign") loadSigns();
        else loadCombos();
      }
    };
  }

  // Настройки
  function setupSettings() {
    const saved = JSON.parse(localStorage.getItem("admin_settings") || "{}");
    $("settingName").value = saved.name || "";
    $("settingInn").value = saved.inn || "";
    $("settingEmail").value = saved.email || "";
    $("settingTelegram").value = saved.telegram || "";
    $("settingPrice").value = saved.price || "299";

    $("settingsForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const settings = {
        name: $("settingName").value,
        inn: $("settingInn").value,
        email: $("settingEmail").value,
        telegram: $("settingTelegram").value,
        price: $("settingPrice").value,
      };
      localStorage.setItem("admin_settings", JSON.stringify(settings));
      alert("✅ Настройки сохранены");
    });
  }
})();
