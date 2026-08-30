const sqlite3 = require("sqlite3").verbose();

// เปิดไฟล์ users.db
const db = new sqlite3.Database("./users.db");

// ดึงข้อมูลผู้ใช้ทั้งหมดจากตาราง users
db.all("SELECT * FROM users", [], (err, rows) => {
  if (err) {
    console.error("❌ Error reading database:", err.message);
  } else {
    console.log("📋 Users in database:");

    // กรองซ้ำโดย email + password
    const uniqueUsers = [];
    const seen = new Set();

    for (const user of rows) {
      const key = `${user.email}|${user.password}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueUsers.push(user);
      }
    }

    console.table(uniqueUsers);
  }
  db.close();
});
