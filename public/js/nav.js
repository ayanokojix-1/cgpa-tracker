function renderNavbar(active) {
  const nav = document.createElement("header");
  nav.className = "border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between";
  nav.innerHTML = `
    <div>
      <p class="font-mono text-[10px] tracking-[0.3em] uppercase brass-text">Academic Ledger</p>
      <h1 class="font-display text-xl font-semibold">CGPA Tracker</h1>
    </div>
    <nav class="flex items-center gap-5">
      <a href="/dashboard.html" class="text-sm nav-link ${active === "dashboard" ? "nav-active" : ""}">Home</a>
      <a href="/courses.html" class="text-sm nav-link ${active === "courses" ? "nav-active" : ""}">Add Courses</a>
      <button id="logout-btn" class="btn-ghost rounded px-3 py-1.5 text-xs">Log out</button>
    </nav>
  `;
  document.body.prepend(nav);

  nav.querySelector("#logout-btn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/index.html";
  });
}