// ================= TOOLTIPS =================
const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
tooltips.forEach(el => new bootstrap.Tooltip(el));

// ================= ALERT AUTO HIDE =================
setTimeout(() => {
  let alerts = document.querySelectorAll(".alert");
  alerts.forEach(alert => {
    alert.style.display = "none";
  });
}, 3000);

// ================= DARK MODE =================
const toggleBtn = document.getElementById("darkModeToggle");

// Page load pe theme apply karo
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  document.documentElement.classList.add("dark-mode");
}

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    document.documentElement.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
}

// ================= SEARCH AUTOCOMPLETE =================
function setupSearch(inputId, boxId) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(boxId);

  if (!input || !box) return;

  input.addEventListener("input", async () => {
    const q = input.value.trim();

    if (q.length < 2) {
      box.style.display = "none";
      return;
    }

    try {
      const res = await fetch(`/listings/suggest?q=${encodeURIComponent(q)}`);
      const suggestions = await res.json();

      if (suggestions.length === 0) {
        box.style.display = "none";
        return;
      }

      box.innerHTML = suggestions.map(s => `
        <li style="
          padding: 10px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #222;
        "
        onmouseover="this.style.background='#f7f7f7'"
        onmouseout="this.style.background='white'"
        onclick="selectSuggestion('${inputId}', '${boxId}', \`${s.replace(/`/g, "'")}\`)">
          <i class="fa-solid fa-location-dot" style="color:#fe424d;"></i>
          ${s}
        </li>
      `).join("");

      box.style.display = "block";

    } catch (err) {
      console.log("Suggestion error:", err);
    }
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !box.contains(e.target)) {
      box.style.display = "none";
    }
  });
}

function selectSuggestion(inputId, boxId, value) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(boxId);
  input.value = value;
  box.style.display = "none";
  input.closest("form").submit();
}

setupSearch("searchInput", "suggestionBox");
setupSearch("searchInputMobile", "suggestionBoxMobile");