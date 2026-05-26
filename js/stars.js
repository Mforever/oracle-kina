(function () {
  const c = document.getElementById("stars");
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
