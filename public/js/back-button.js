// back-button.js — ปุ่ม "กลับ" กลาง ใช้ร่วมกันทุกหน้า (เหมือน navbar-account.js)
// ใส่ style กลางครั้งเดียว แล้ว inject ปุ่มไว้ใต้ navbar ทันที ไม่ทับเมนู ไม่ทับเนื้อหา
// ใช้ history.back() เป็นหลัก (ย้อนไปหน้าที่ผู้ใช้มาจริง ๆ) และ fallback เป็น URL ที่กำหนดถ้าไม่มีประวัติ
(function () {
  const STYLE_ID = "global-back-btn-style";
  const BAR_ID = "back-button-bar";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${BAR_ID} {
        padding: 12px 20px 0;
        box-sizing: border-box;
      }
      #global-back-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #f4f4f4;
        color: #333;
        border: none;
        border-radius: 999px;
        padding: 8px 16px 8px 12px;
        font-size: 14px;
        font-family: "Kanit", inherit;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.15s ease;
      }
      #global-back-btn:hover {
        background: #e8e8e8;
        transform: translateX(-2px);
      }
      #global-back-btn svg {
        width: 16px;
        height: 16px;
        stroke: currentColor;
        flex-shrink: 0;
      }
      body.dark #global-back-btn {
        background: #2a2a2a;
        color: #e0e0e0;
      }
      body.dark #global-back-btn:hover {
        background: #383838;
      }
    `;
    document.head.appendChild(style);
  }

  function injectBar(fallbackHref) {
    if (document.getElementById(BAR_ID)) return; // กันแทรกซ้ำ

    const bar = document.createElement("div");
    bar.id = BAR_ID;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "global-back-btn";
    btn.setAttribute("aria-label", "กลับ");
    btn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>' +
      "<span>กลับ</span>";

    btn.addEventListener("click", function () {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = fallbackHref || "/home";
      }
    });

    bar.appendChild(btn);

    const navContainer = document.getElementById("navbar-container");
    if (navContainer && navContainer.parentNode) {
      navContainer.parentNode.insertBefore(bar, navContainer.nextSibling);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }
  }

  window.initBackButton = function (fallbackHref) {
    injectStyle();
    injectBar(fallbackHref);
  };
})();
