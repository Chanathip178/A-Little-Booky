let ALL_DATA = null;
const searchInput = document.getElementById("search");
const suggestionsBox = document.getElementById("suggestions");

// Escape HTML to avoid potential injection
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Filter novels
function getSuggestions(query) {
  if (!ALL_DATA) return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return ALL_DATA.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.author.toLowerCase().includes(q) ||
      (n.category && n.category.toLowerCase().includes(q))
  ).slice(0, 8); // limit to 8 results
}

// Render dropdown (plain text, no <mark>)
function renderSuggestions(list) {
  if (list.length === 0) {
    suggestionsBox.hidden = true;
    suggestionsBox.innerHTML = "";
    return;
  }

  suggestionsBox.innerHTML = list
    .map(
      (novel) => `
    <div class="suggestion-item" data-id="${escapeHtml(novel.id)}">
      ${escapeHtml(novel.title)} - <small>${escapeHtml(novel.author)}</small>
    </div>
  `
    )
    .join("");

  suggestionsBox.hidden = false;
}

// Event: typing
searchInput.addEventListener("input", () => {
  const query = searchInput.value;
  const results = getSuggestions(query);
  renderSuggestions(results);
});

// Event: click suggestion
suggestionsBox.addEventListener("click", (e) => {
  const item = e.target.closest(".suggestion-item");
  if (!item) return;

  const novelId = item.dataset.id;
  console.log("Selected novel ID:", novelId);

  // Example: redirect to detail page
  window.location.href = "/detail?id=" + encodeURIComponent(novelId);
});

// Event: click outside to close dropdown
document.addEventListener("click", (e) => {
  if (!e.target.closest(".autocomplete")) {
    suggestionsBox.hidden = true;
  }
});

// Load initial data
async function loadInitial() {
  const res = await fetch("/api/shop/books");
  const data = await res.json();
  ALL_DATA = data.novels || [];
}
loadInitial();
