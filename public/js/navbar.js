function highlightMenu(currentPath) {
  const menuLinks = document.querySelectorAll(".menu a");
  menuLinks.forEach(link => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// dropdown profile เหมือนเดิม
document.addEventListener("DOMContentLoaded", () => {
  const profile = document.querySelector(".profile");
  const dropdown = document.querySelector(".dropdown");

  if (profile && dropdown) {
    profile.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      dropdown.classList.remove("show");
    });
  }
});
