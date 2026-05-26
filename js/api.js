window.Oracle = window.Oracle || {};

Oracle.api = {
  fetchSign: function (date) {
    return fetch("/api/sign?date=" + encodeURIComponent(date)).then((r) =>
      r.json(),
    );
  },
  createPayment: function (email, date) {
    return fetch("/api/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, date }),
    }).then((r) => r.json());
  },
};
