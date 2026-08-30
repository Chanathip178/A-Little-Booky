// scripts/migrate.js
// ย้ายข้อมูลเดิมเข้า MongoDB + Cloudinary ครั้งเดียว
//   - public/novels.json (67 เล่ม)  -> Book collection (อัปโหลดปกขึ้น Cloudinary)
//   - users.db (SQLite)             -> User collection (แฮชรหัสผ่านด้วย bcrypt)
//
// วิธีใช้:  node scripts/migrate.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const cloudinary = require("../config/cloudinary");
const Book = require("../models/Book");
const User = require("../models/User");

const SALT_ROUNDS = 10;

// อ่านไฟล์เป็น buffer แล้วอัปโหลดผ่าน upload_stream แทนการส่ง path ตรงๆ
// (ส่ง path ตรงๆ ทำให้ไฟล์บางไฟล์ที่ชื่อเป็นภาษาไทยพัง error "Invalid URL for upload"
//  บนบางเครื่อง Windows — อ่านเป็น buffer เองจะเลี่ยงปัญหานี้ได้เสมอ)
function uploadFileToCloudinary(filePath, folder = "booky/covers") {
  const buffer = fs.readFileSync(filePath);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// แปลงค่า price/word ที่ในไฟล์ novels.json บางเล่มเป็นข้อความ (เช่น "Free", "ประมาณ 11,200")
// ให้กลายเป็นตัวเลขเสมอ ก่อนบันทึกลง MongoDB (field เหล่านี้ต้องเป็น Number)
function parsePrice(v) {
  if (typeof v === "number" && !isNaN(v)) return v;
  const s = String(v ?? "").trim();
  if (!s || /free|ฟรี/i.test(s)) return 0;
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function parseWordCount(v) {
  if (typeof v === "number" && !isNaN(v)) return v;
  const s = String(v ?? "");
  const n = parseInt(s.replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

async function migrateBooks() {
  const novelsPath = path.join(__dirname, "..", "public", "novels.json");
  const raw = JSON.parse(fs.readFileSync(novelsPath, "utf-8"));
  const novels = raw.novels || [];

  console.log(`📚 พบ ${novels.length} เล่มใน novels.json`);
  let created = 0, skipped = 0, failed = 0;

  for (const n of novels) {
    const exists = await Book.findOne({ bookId: n.id });
    if (exists) { skipped++; continue; }

    const imgPath = path.join(__dirname, "..", "public", n.Image || "");
    let secureUrl = "";
    let publicId = "";

    if (n.Image && fs.existsSync(imgPath)) {
      try {
        const result = await uploadFileToCloudinary(imgPath);
        secureUrl = result.secure_url;
        publicId = result.public_id;
      } catch (err) {
        console.error(`  ❌ อัปโหลดรูปไม่สำเร็จ (${n.title}):`, err.message);
        failed++;
        continue;
      }
    } else {
      console.warn(`  ⚠️  ไม่พบไฟล์รูป: ${imgPath} (เล่ม: ${n.title})`);
    }

    try {
      await Book.create({
        bookId: n.id,
        title: n.title,
        author: n.author || "",
        category: n.category || "",
        date: n.date || "",
        word: parseWordCount(n.word),
        price: parsePrice(n.price),
        Image: secureUrl,
        imagePublicId: publicId,
        description: n.description || "",
        content: n.content || "",
        owner: null,
      });
      created++;
    } catch (err) {
      console.error(`  ❌ บันทึกลง MongoDB ไม่สำเร็จ (${n.title}):`, err.message);
      failed++;
      continue;
    }
    process.stdout.write(`  ✅ ${created + skipped}/${novels.length}\r`);
  }

  console.log(`\n📚 หนังสือ: สร้างใหม่ ${created}, ข้าม(มีอยู่แล้ว) ${skipped}, ล้มเหลว ${failed}`);
}

async function migrateUsers() {
  const dbPath = path.join(__dirname, "..", "users.db");
  if (!fs.existsSync(dbPath)) {
    console.log("👤 ไม่พบ users.db ข้ามขั้นตอนนี้");
    return;
  }

  let sqlite3;
  try {
    sqlite3 = require("sqlite3").verbose();
  } catch (err) {
    console.warn("⚠️  โมดูล sqlite3 ใช้งานไม่ได้ในเครื่องนี้ (native binding ผิด platform) — ข้ามการย้ายผู้ใช้เดิม");
    console.warn("    ถ้าต้องการย้ายผู้ใช้เดิมจริงๆ ให้รัน `npm rebuild sqlite3` บนเครื่องที่จะรันสคริปต์นี้ก่อน");
    return;
  }

  const db = new sqlite3.Database(dbPath);
  const rows = await new Promise((resolve, reject) => {
    db.all("SELECT * FROM users", [], (err, rows) => (err ? reject(err) : resolve(rows)));
  });
  db.close();

  console.log(`👤 พบผู้ใช้เดิม ${rows.length} คนใน users.db`);
  let created = 0, skipped = 0;

  for (const row of rows) {
    const exists = await User.findOne({ email: row.email });
    if (exists) { skipped++; continue; }

    // รหัสผ่านเดิมเก็บเป็น plaintext -> แฮชใหม่ตอนย้ายข้อมูล
    const hashed = await bcrypt.hash(row.password, SALT_ROUNDS);
    const purchasedBooks = row.purchased_books ? row.purchased_books.split(",").filter(Boolean) : [];
    const ageNum = parseInt(row.age, 10);

    try {
      await User.create({
        username: row.username,
        email: row.email,
        password: hashed,
        age: isNaN(ageNum) ? 0 : ageNum, // แถวเดิมบางแถวไม่มีอายุ -> ใส่ 0 ไปก่อน (แก้ในระบบทีหลังได้)
        purchasedBooks,
      });
      created++;
    } catch (err) {
      console.error(`  ❌ ย้ายผู้ใช้ไม่สำเร็จ (${row.email}):`, err.message);
      continue;
    }
  }

  console.log(`👤 ผู้ใช้: สร้างใหม่ ${created}, ข้าม(มีอยู่แล้ว) ${skipped}`);
}

(async () => {
  await connectDB();
  await migrateBooks();
  await migrateUsers();
  await mongoose.disconnect();
  console.log("🎉 ย้ายข้อมูลเสร็จสิ้น");
  process.exit(0);
})().catch((err) => {
  console.error("❌ Migration ล้มเหลว:", err);
  process.exit(1);
});
