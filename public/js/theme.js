// theme.js — ใช้ร่วมกันทุกหน้า ให้ปุ่ม Dark/Light mode ทำงานเหมือนกันทุกหน้า (เหมือนหน้า Home)
// ใส่ class "dark" ทั้งที่ <html> และ <body> พร้อมกัน เพื่อให้ทั้ง CSS ปกติ (body.dark {...})
// และ Tailwind dark: utilities (ที่ต้องมี .dark เป็น ancestor) ทำงานถูกต้องทั้งคู่
(function () {
  function applyTheme(theme) {
    const toggleBtn = document.getElementById("darkmode-toggle");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-regular fa-moon"></i>';
    }
  }
  // เปิดให้หน้าอื่นเรียกซ้ำได้ (เช่น หลัง navbar โหลดเสร็จ เพื่อ sync ไอคอนให้ตรง)
  window.applyTheme = applyTheme;

  function init() {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);
  }
  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);

  // ใช้ event delegation กับ document เพื่อให้กดปุ่มติดไม่ว่าปุ่มจะถูกโหลดเข้ามาทีหลัง (เช่นผ่าน fetch navbar) เมื่อไหร่ก็ตาม
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#darkmode-toggle")) {
      const currentTheme = document.body.classList.contains("dark") ? "dark" : "light";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);
      applyTheme(newTheme);
    }
  });
})();
