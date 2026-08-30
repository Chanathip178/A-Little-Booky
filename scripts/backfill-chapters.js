// scripts/backfill-chapters.js
// แก้บัค: ตอน migrate.js ครั้งแรก schema ของ Book ยังไม่มี field "chapters"
// ทำให้นิยาย 42 เรื่องที่ในไฟล์ novels.json เป็นแบบ "หลายตอน" (chapters array)
// ถูกย้ายเข้า MongoDB โดยไม่มีเนื้อหาเลย (content ว่าง, ไม่มี chapters)
//
// สคริปต์นี้ไล่เทียบ public/novels.json กับ Book collection ทีละเล่มด้วย bookId
// แล้วเติม field "chapters" ให้เฉพาะเล่มที่ยังไม่มีเนื้อหา (content ว่าง และ chapters ว่าง)
// เล่มที่มีเนื้อหาอยู่แล้วจะถูกข้าม ไม่กระทบข้อมูลเดิม
//
// วิธีใช้:  node scripts/backfill-chapters.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const Book = require("../models/Book");

async function main() {
  await connectDB();

  const novelsPath = path.join(__dirname, "..", "public", "novels.json");
  const raw = JSON.parse(fs.readFileSync(novelsPath, "utf-8"));
  const novels = Array.isArray(raw) ? raw : raw.novels || raw;

  let updated = 0;
  let skippedHasContent = 0;
  let skippedNoChapters = 0;
  let notFound = 0;

  for (const n of novels) {
    const bookId = n.id ?? n.Id;
    if (bookId === undefined) continue;

    if (!n.chapters || !Array.isArray(n.chapters) || n.chapters.length === 0) {
      skippedNoChapters++;
      continue;
    }

    const book = await Book.findOne({ bookId });
    if (!book) {
      notFound++;
      console.log(`⚠️  ไม่พบเล่ม bookId=${bookId} (${n.title}) ใน MongoDB`);
      continue;
    }

    const hasContent = book.content && book.content.trim().length > 0;
    const hasChapters = book.chapters && book.chapters.length > 0;
    if (hasContent || hasChapters) {
      skippedHasContent++;
      continue;
    }

    book.chapters = n.chapters.map((c) => ({
      chapter: c.chapter || "",
      content: c.content || "",
    }));
    await book.save();
    updated++;
    console.log(`✅ เติมเนื้อหาให้ bookId=${bookId} (${n.title}) — ${book.chapters.length} ตอน`);
  }

  console.log("\n===== สรุปผล =====");
  console.log(`เติมเนื้อหาสำเร็จ: ${updated} เล่ม`);
  console.log(`ข้าม (มีเนื้อหาอยู่แล้ว): ${skippedHasContent} เล่ม`);
  console.log(`ข้าม (ไม่ได้เป็นแบบ chapters): ${skippedNoChapters} เล่ม`);
  console.log(`ไม่พบใน MongoDB: ${notFound} เล่ม`);

  await require("mongoose").disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ เกิดข้อผิดพลาด:", err);
  process.exit(1);
});
