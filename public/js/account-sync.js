// public/js/account-sync.js
// รวมฟังก์ชัน sync รายการโปรด/ตะกร้า/ที่ซื้อแล้ว ระหว่าง localStorage (ฝั่งเครื่อง)
// กับบัญชีผู้ใช้ใน MongoDB (ฝั่งเซิร์ฟเวอร์) เพื่อให้สลับเครื่อง/เบราว์เซอร์แล้วข้อมูลยังอยู่
(function () {
  // ดึงข้อมูล favorites/cart/purchased จากบัญชีบนเซิร์ฟเวอร์ แล้วเขียนทับ localStorage
  // ให้ตรงกับบัญชี (ใช้ตอนล็อกอินสำเร็จ)
  async function hydrateAccountData(userId) {
    try {
      const [accountRes, booksRes] = await Promise.all([
        fetch(`/api/shop/account/${userId}`).then((r) => r.json()),
        fetch("/api/shop/books").then((r) => r.json()),
      ]);
      if (!accountRes.success || !booksRes.success) return;

      const novels = booksRes.novels || [];
      const findNovel = (id) => novels.find((n) => n.id === id);

      const favorites = (accountRes.favorites || [])
        .map(findNovel)
        .filter(Boolean);
      localStorage.setItem("favorites", JSON.stringify(favorites));

      const cart = (accountRes.cart || [])
        .map((item) => {
          const novel = findNovel(item.bookId);
          return novel ? { ...novel, qty: item.qty || 1 } : null;
        })
        .filter(Boolean);
      localStorage.setItem("cart", JSON.stringify(cart));

      const purchased = (accountRes.purchasedBooks || [])
        .map((idStr) => {
          const novel = findNovel(Number(idStr));
          return novel ? { id: novel.id, title: novel.title } : null;
        })
        .filter(Boolean);
      localStorage.setItem("purchased", JSON.stringify(purchased));
    } catch (err) {
      console.error("hydrateAccountData error:", err);
    }
  }

  function getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user && user.id ? user.id : null;
    } catch {
      return null;
    }
  }

  // เรียก API เหล่านี้แบบ fire-and-forget (ไม่บล็อก UI) เฉพาะตอนล็อกอินอยู่
  function syncFavoriteAdd(bookId) {
    const userId = getCurrentUserId();
    if (!userId) return;
    fetch(`/api/shop/favorites/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    }).catch((err) => console.error("syncFavoriteAdd error:", err));
  }

  function syncFavoriteRemove(bookId) {
    const userId = getCurrentUserId();
    if (!userId) return;
    fetch(`/api/shop/favorites/${userId}/${bookId}`, { method: "DELETE" }).catch(
      (err) => console.error("syncFavoriteRemove error:", err)
    );
  }

  function syncCartAdd(bookId, qty) {
    const userId = getCurrentUserId();
    if (!userId) return;
    fetch(`/api/shop/cart/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, qty: qty || 1 }),
    }).catch((err) => console.error("syncCartAdd error:", err));
  }

  function syncCartRemove(bookId) {
    const userId = getCurrentUserId();
    if (!userId) return;
    fetch(`/api/shop/cart/${userId}/${bookId}`, { method: "DELETE" }).catch(
      (err) => console.error("syncCartRemove error:", err)
    );
  }

  window.AccountSync = {
    hydrateAccountData,
    getCurrentUserId,
    syncFavoriteAdd,
    syncFavoriteRemove,
    syncCartAdd,
    syncCartRemove,
  };
})();
