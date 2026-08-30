const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./users.db");

// เพิ่มคอลัมน์ age ถ้ายังไม่มี
db.run("ALTER TABLE users ADD COLUMN age INTEGER", (err) => {
  if (err) {
    console.error("❌ Error:", err.message);
  } else {
    console.log("✅ Column 'age' added successfully");
  }
  db.close();
});
