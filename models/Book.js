const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  bookId: { type: Number, required: true, unique: true }, // เลข id เดิมที่ frontend ใช้อ้างอิง (?id=)
  title: { type: String, required: true },
  author: { type: String, default: "" },
  category: { type: String, default: "" },
  date: { type: String, default: "" },
  word: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  Image: { type: String, default: "" },       // Cloudinary secure_url
  imagePublicId: { type: String, default: "" }, // Cloudinary public_id (ไว้ลบรูปภายหลัง)
  description: { type: String, default: "" },
  content: { type: String, default: "" },
  chapters: {
    type: [{
      chapter: { type: String, default: "" },
      content: { type: String, default: "" },
      _id: false,
    }],
    default: [],
  }, // นิยายแบบแบ่งหลายตอน (ถ้ามี chapters จะไม่ใช้ content เดี่ยว)
  owner: { type: String, default: null }, // userId ของคนที่เพิ่มหนังสือเอง (null = หนังสือชุดต้นฉบับของระบบ)
}, { timestamps: true });

module.exports = mongoose.model("Book", bookSchema);
