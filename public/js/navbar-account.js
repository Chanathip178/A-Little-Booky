// public/js/navbar-account.js
// จัดการเมนู profile (จุดสามจุด/ไอคอนคน มุมขวาบน) + ปุ่ม "ออกจากระบบ" แบบรวมศูนย์
// ให้ทำงานเหมือนกันทุกหน้าที่ใช้ navbar-main.html (ก่อนหน้านี้แต่ละหน้า copy โค้ดเปิด/ปิด
// dropdown เอาไว้เอง ทำให้บางหน้า เช่น detail, add-book, content ไม่มีโค้ดนี้เลย
// กดไอคอนโปรไฟล์แล้วไม่มีอะไรเกิดขึ้น กดออกจากระบบไม่ได้)
//
// เรียกใช้หลังจาก navbar-main ถูก fetch เข้ามาใน DOM แล้ว (เช่นเดียวกับ theme.js)
(function () {
  function initProfileDropdown() {
    const profile = document.querySelector(".profile");
    const dropdown = document.querySelector(".dropdown");
    if (!profile || !dropdown) return;

    // กันไม่ให้ผูก event ซ้ำถ้าไฟล์นี้ถูกเรียกมากกว่าหนึ่งครั้ง
    if (profile.dataset.dropdownBound === "1") return;
    profile.dataset.dropdownBound = "1";

    profile.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });
    document.addEventListener("click", () => {
      dropdown.classList.remove("show");
    });
  }

  function initLogout() {
    const logoutLink = document.querySelector('a[href="/logout"]');
    if (!logoutLink) return;
    if (logoutLink.dataset.logoutBound === "1") return;
    logoutLink.dataset.logoutBound = "1";

    logoutLink.addEventListener("click", (e) => {
      // เคลียร์สถานะผู้ใช้ทั้งหมดออกจากเครื่องก่อนค่อยไปหน้า pre-login
      // (ก่อนหน้านี้ /logout แค่ redirect แต่ไม่เคยเคลียร์ localStorage เลย
      //  ทำให้ดูเหมือนออกจากระบบไม่สำเร็จ ย้อนกลับมาแล้วยังเข้าระบบอยู่)
      e.preventDefault();
      localStorage.removeItem("user");
      localStorage.removeItem("purchased");
      localStorage.removeItem("favorites");
      localStorage.removeItem("cart");
      // สั่ง navigate เองแบบชัดเจน แทนที่จะปล่อยให้ <a href> นำทางตามปกติ
      window.location.href = "/logout";
    });
  }

  window.initNavbarAccount = function () {
    initProfileDropdown();
    initLogout();
  };
})();
