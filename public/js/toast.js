// public/js/toast.js
// Toast แจ้งเตือนแบบไม่บล็อกหน้าจอ ใช้แทน alert() ของเบราว์เซอร์ทั่วทั้งเว็บ
// วิธีใช้: showToast("ข้อความ")  หรือ  showToast("ข้อความ", "error")
(function () {
  const TYPE_COLORS = {
    info: "#8b5cf6",
    success: "#22c55e",
    error: "#ef4444",
  };

  function ensureContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.cssText = [
        "position:fixed",
        "top:20px",
        "left:50%",
        "transform:translateX(-50%)",
        "z-index:99999",
        "display:flex",
        "flex-direction:column",
        "gap:10px",
        "align-items:center",
        "pointer-events:none",
      ].join(";");
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type, duration) {
    type = type || "info";
    duration = duration || 3000;

    const run = () => {
      const container = ensureContainer();
      const toast = document.createElement("div");
      toast.textContent = message;
      toast.style.cssText = [
        "background:" + (TYPE_COLORS[type] || TYPE_COLORS.info),
        "color:#fff",
        "padding:12px 20px",
        "border-radius:10px",
        "font-family:'Kanit',sans-serif",
        "font-size:15px",
        "box-shadow:0 6px 20px rgba(0,0,0,0.2)",
        "opacity:0",
        "transform:translateY(-10px)",
        "transition:opacity 0.25s, transform 0.25s",
        "max-width:90vw",
        "text-align:center",
        "pointer-events:auto",
      ].join(";");
      container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
      });

      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => toast.remove(), 250);
      }, duration);
    };

    if (document.body) run();
    else document.addEventListener("DOMContentLoaded", run);
  }

  window.showToast = showToast;
})();
