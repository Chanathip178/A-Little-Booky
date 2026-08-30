// ===== เลือกปุ่มและ modal =====
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");

// ===== เคลียร์ค่าฟอร์ม (กันค่าเก่า/ที่กรอกผิดค้างอยู่เวลาเปิด modal ใหม่) =====
function clearLoginFields() {
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
}

function clearRegisterFields() {
  document.getElementById("registerUsername").value = "";
  document.getElementById("registerEmail").value = "";
  document.getElementById("registerPassword").value = "";
  document.getElementById("registerConfirm").value = "";
  document.getElementById("registerAge").value = "";
}

// ===== เปิด modal =====
loginBtn.onclick = () => {
  clearLoginFields();
  loginModal.style.display = "flex";
};
registerBtn.onclick = () => {
  clearRegisterFields();
  registerModal.style.display = "flex";
};

// ===== ปิด modal =====
function closeModal(id) {
  document.getElementById(id).style.display = "none";
  if (id === "loginModal") clearLoginFields();
  if (id === "registerModal") clearRegisterFields();
}

// ===== กดนอก popup แล้วปิด =====
window.onclick = function(event) {
  if (event.target.classList.contains("modal")) {
    closeModal(event.target.id);
  }
}

// ===== ฟังก์ชันสมัครสมาชิก =====
function handleRegister() {
  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("registerConfirm").value;
  const age = document.getElementById("registerAge").value; // ✅ ดึงค่าอายุ

  if (!username || !email || !password || !confirmPassword || !age) {
    return showToast("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
  }

  if (password !== confirmPassword) {
    return showToast("รหัสผ่านไม่ตรงกัน", "error");
  }

  fetch("/api/shop/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, age: parseInt(age) })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast("สมัครสมาชิกสำเร็จ! โปรดเข้าสู่ระบบ", "success");
        closeModal("registerModal");
        clearLoginFields();
        loginModal.style.display = "flex";
      } else {
        showToast("สมัครไม่สำเร็จ: " + data.message, "error");
      }
    })
    .catch(err => console.error("Register Error:", err));
}

// ===== ฟังก์ชันเข้าสู่ระบบ =====
function handleLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    return showToast("กรุณากรอก Email และ Password", "error");
  }

  fetch("/api/shop/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast("เข้าสู่ระบบสำเร็จ!", "success");
        localStorage.setItem("user", JSON.stringify(data.user));
        const finishLogin = () => { window.location.href = "/home"; };
        if (window.AccountSync) {
          window.AccountSync.hydrateAccountData(data.user.id)
            .finally(() => setTimeout(finishLogin, 700));
        } else {
          setTimeout(finishLogin, 700);
        }
      } else {
        showToast("เข้าสู่ระบบไม่สำเร็จ: " + data.message, "error");
      }
    })
    .catch(err => console.error("Login Error:", err));
}