const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./users.db");

db.run("ALTER TABLE users ADD COLUMN purchased_books TEXT", (err) => {
  if (err) {
    console.error("❌ Error:", err.message);
  } else {
    console.log("✅ Column 'purchased_books' added successfully");
  }
  db.close();
});
