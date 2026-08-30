(function () {
  const el = {
    toggle: null,
    win: null,
    msgs: null,
    actions: null,
  };

  const state = {
    data: null,
    mode: "root", // root | categories | novels | payments | unlock
    selectedCategoryId: null,
  };

  function $(sel) {
    return document.querySelector(sel);
  }
  function createBtn(text, onClick) {
    const b = document.createElement("button");
    b.textContent = text;
    b.style.margin = "6px 6px 0 0";
    b.style.padding = "8px 12px";
    b.style.border = "1px solid #ddd";
    b.style.borderRadius = "999px";
    b.style.background = "#f7f7ff";
    b.style.cursor = "pointer";
    b.style.fontSize = "14px";       // บังคับ font-size
    b.style.fontFamily = "Kanit, sans-serif"; // บังคับ font-family
    b.style.lineHeight = "1.2";      // บังคับ line-height
    b.addEventListener("click", onClick);
    return b;
  }

  function pushMsg(role, text) {
    const row = document.createElement("div");
    row.style.margin = "8px 0";

    const bubble = document.createElement("div");
    bubble.textContent = text;
    bubble.style.display = "inline-block";
    bubble.style.padding = "8px 10px";
    bubble.style.borderRadius = "12px";
    bubble.style.maxWidth = "85%";
    bubble.style.whiteSpace = "pre-wrap";
    bubble.style.wordBreak = "break-word";

    if (role === "bot") {
      bubble.style.background = "#f3f4f6";
      bubble.style.color = "#111827";
    } else {
      row.style.textAlign = "right";
      bubble.style.background = "#6b46c1";
      bubble.style.color = "#fff";
    }

    row.appendChild(bubble);
    el.msgs.appendChild(row);
    el.msgs.scrollTop = el.msgs.scrollHeight;
  }

  function showActions(buttons) {
    el.actions.innerHTML = "";
    buttons.forEach((btn) => el.actions.appendChild(btn));
  }

  function toRoot() {
    state.mode = "root";
    showRoot();
  }

  function showRoot() {
    const faq = state.data.faq || [];
    const categories = state.data.categories || [];

    pushMsg("bot", "คุณอยากถามเรื่องไหนคะ?");
    const buttons = [];

    // ปุ่ม FAQ (แต่ละคำถาม)
    faq.forEach((item) => {
      buttons.push(
        createBtn(item.question, () => {
          pushMsg("user", item.question);
          showAnswer(item.answer);
        })
      );
    });

    // ปุ่มเรียกดูหมวดหมู่
    if (categories.length) {
      buttons.push(
        createBtn("เรียกดูหมวดหมู่", () => {
          pushMsg("user", "เรียกดูหมวดหมู่");
          showCategories();
        })
      );
    }

    showActions(buttons);
  }

  function showAnswer(answer) {
    pushMsg("bot", answer);
    showActions([
      createBtn("กลับ", () => {
        pushMsg("user", "กลับ");
        showRoot();
      })
    ]);
  }

  function showCategories() {
    const cats = state.data.categories || [];
    if (!cats.length) {
      pushMsg("bot", "ไม่มีหมวดหมู่ในระบบ");
      return showActions([
        createBtn("กลับ", () => {
          pushMsg("user", "กลับ");
          showRoot();
        })
      ]);
    }

    pushMsg("bot", "เลือกหมวดหมู่ที่สนใจ :");
    const buttons = cats.map((c) =>
      createBtn(c.name, () => {
        pushMsg("user", c.name);
        showNovelsInCategory(c.id);
      })
    );

    buttons.push(
      createBtn("กลับ", () => {
        pushMsg("user", "กลับ");
        showRoot();
      })
    );

    showActions(buttons);
  }

  async function showNovelsInCategory(catId) {
  const cat = (state.data.categories || []).find(c => c.id === catId);
  if (!cat) return;

  let novelsData = [];
  try {
    const res = await fetch("/api/shop/books");
    const data = await res.json();
    novelsData = data.novels || [];
  } catch (e) {
    console.error("ไม่สามารถโหลดข้อมูลหนังสือ:", e);
  }

  const novels = cat.novels
    .map(id => novelsData.find(n => n.id === id))
    .filter(Boolean);

  if (!novels.length) {
    pushMsg("bot", `ยังไม่มีนิยายในหมวด "${cat.name}"`);
    return showActions([
      createBtn("กลับ", () => { pushMsg("user","กลับ"); showCategories(); })
    ]);
  }

  pushMsg("bot", `นิยายในหมวด ${cat.name} : เลือกเรื่องที่สนใจ`);
  const buttons = novels.map(n =>
    createBtn(n.title, () => {
      pushMsg("user", n.title);
      showNovelDetail(n, cat.name);
    })
  );

  buttons.push(createBtn("กลับ", () => { pushMsg("user","กลับ"); showCategories(); }));

  showActions(buttons);
}

function showNovelDetail(novel, categoryName) {
  const priceStr = novel.price != null ? `฿${novel.price}` : "";
  const msg =
    `ชื่อเรื่อง: ${novel.title}\n` +
    `ผู้แต่ง: ${novel.author}\n` +
    `หมวดหมู่: ${categoryName}\n` +
    `ราคา: ${priceStr}\n` +
    `รายละเอียด: ${novel.description}`;

  pushMsg("bot", msg);

  const buttons = [];
  if (novel.locked) {
    buttons.push(createBtn("ปลดล็อค", () => {
      novel.locked = false;
      pushMsg("bot", `คุณปลดล็อคนิยาย "${novel.title}" เรียบร้อยแล้ว ✅`);
      showNovelDetail(novel, categoryName);
    }));
  }

  buttons.push(
    createBtn("กลับหน้าแรก", () => {
      pushMsg("user", "กลับกลับหน้าแรก");
      showRoot();
    })
  );

  showActions(buttons);
}

  async function init() {
    el.toggle = $("#chatbot-btn");
    el.win = $("#chatbot-window");
    el.msgs = $("#chatbot-messages");
    el.actions = $("#chatbot-actions");

    el.toggle.addEventListener("click", () => {
      const showing = el.win.style.display !== "none";
      el.win.style.display = showing ? "none" : "block";
      if (!showing && el.msgs.childElementCount === 0) {
        pushMsg("bot", "สวัสดี! ฉันคือผู้แชทบอทผู้ช่วย");
        showRoot();
      }
    });

    try {
      const res = await fetch("/chatbot.json");
      state.data = await res.json();
    } catch (e) {
      console.error("Failed to load chatbot data:", e);
      state.data = { paymentMethods: [], categories: [], faq: {} };
    }
  }

  document.addEventListener("DOMContentLoaded", init);
  window.bootChatbot = function () {
    if (window.__chatbotBooted) return; // avoid double-init across pages
    window.__chatbotBooted = true;
    init();
  };
})();
