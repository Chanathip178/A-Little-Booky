// routes/shop.js
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const User = require("../models/User");
const Book = require("../models/Book");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload");

const SALT_ROUNDS = 10;

// อัปโหลด buffer ขึ้น Cloudinary ผ่าน upload_stream (ไม่เขียนไฟล์ลงดิสก์)
function uploadBufferToCloudinary(buffer, folder = "booky") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// ==================== REGISTER ====================
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, age } = req.body;
    const ageInt = parseInt(age);
    if (!username || !email || !password || isNaN(ageInt) || ageInt <= 0) {
      return res.json({ success: false, message: "กรุณากรอกข้อมูลให้ครบและถูกต้อง" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ username, email, password: hashed, age: ageInt });

    res.json({ success: true, message: "สมัครสมาชิกสำเร็จ", userId: user._id });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ==================== LOGIN ====================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    res.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: { id: user._id, username: user.username, email: user.email, age: user.age },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== ซื้อหนังสือ ====================
router.post("/buy/:bookId", async (req, res) => {
  try {
    const { userId } = req.body;
    const bookId = req.params.bookId;
    if (!userId) return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบก่อน" });

    // ใช้ atomic update ($addToSet) แทน findById -> save เพื่อกัน VersionError
    // เวลามีหลาย request เข้ามาพร้อมกัน (เช่น ตอนจ่ายเงินหลายเล่มพร้อมกัน)
    const existing = await User.findById(userId).select("purchasedBooks");
    if (!existing) return res.status(404).json({ success: false, message: "ไม่พบบัญชีผู้ใช้" });
    if (existing.purchasedBooks.includes(bookId)) {
      return res.json({ success: false, message: "คุณซื้อเล่มนี้แล้ว" });
    }

    await User.findByIdAndUpdate(userId, { $addToSet: { purchasedBooks: bookId } });

    res.json({ success: true, message: "ซื้อหนังสือสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== ข้อมูลบัญชี (favorites/cart/purchased) สำหรับ sync ข้ามอุปกรณ์ ====================
router.get("/account/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: "ไม่พบบัญชีผู้ใช้" });
    res.json({
      success: true,
      favorites: user.favorites || [],
      cart: user.cart || [],
      purchasedBooks: user.purchasedBooks || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== รายการถูกใจ (ผูกกับบัญชี) ====================
router.post("/favorites/:userId", async (req, res) => {
  try {
    const { bookId } = req.body;
    const id = Number(bookId);
    // atomic update ($addToSet กันซ้ำในตัว) แทน findById -> save เพื่อกัน VersionError เวลามีหลาย request พร้อมกัน
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $addToSet: { favorites: id } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "ไม่พบบัญชีผู้ใช้" });
    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/favorites/:userId/:bookId", async (req, res) => {
  try {
    const id = Number(req.params.bookId);
    // atomic update ($pull) แทน findById -> save เพื่อกัน VersionError เวลามีหลาย request พร้อมกัน
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $pull: { favorites: id } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "ไม่พบบัญชีผู้ใช้" });
    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== ตะกร้าสินค้า (ผูกกับบัญชี) ====================
router.post("/cart/:userId", async (req, res) => {
  try {
    const { bookId, qty } = req.body;
    const id = Number(bookId);
    const addQty = qty || 1;

    // atomic update: ลองเพิ่ม qty ให้ item เดิมก่อน (ถ้ามีอยู่แล้วในตะกร้า)
    let user = await User.findOneAndUpdate(
      { _id: req.params.userId, "cart.bookId": id },
      { $inc: { "cart.$.qty": addQty } },
      { new: true }
    );

    // ถ้ายังไม่มี item นี้ในตะกร้า ให้ push รายการใหม่แบบ atomic
    if (!user) {
      user = await User.findByIdAndUpdate(
        req.params.userId,
        { $push: { cart: { bookId: id, qty: addQty } } },
        { new: true }
      );
    }

    if (!user) return res.status(404).json({ success: false, message: "ไม่พบบัญชีผู้ใช้" });
    res.json({ success: true, cart: user.cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/cart/:userId/:bookId", async (req, res) => {
  try {
    const id = Number(req.params.bookId);
    // atomic update ($pull) แทน findById -> save เพื่อกัน VersionError เวลามีหลาย request พร้อมกัน
    // (เช่น ตอนจ่ายเงิน ที่ยิง /buy กับ /cart DELETE พร้อมกันหลายเล่ม)
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $pull: { cart: { bookId: id } } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "ไม่พบบัญชีผู้ใช้" });
    res.json({ success: true, cart: user.cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== ตรวจสอบการอ่าน ====================
router.get("/read/:userId/:bookId", async (req, res) => {
  try {
    const { userId, bookId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(500).json({ success: false, message: "ไม่พบบัญชีผู้ใช้" });

    if (user.purchasedBooks.includes(bookId)) {
      res.json({ success: true, message: `อ่านหนังสือเล่ม ${bookId} ได้แล้ว` });
    } else {
      res.status(403).json({ success: false, message: "คุณยังไม่ได้ซื้อหนังสือเล่มนี้" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

// ==================== ตรวจสอบอายุผู้ใช้ ====================
router.get("/check-age/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: "ไม่พบบัญชีผู้ใช้" });
    res.json({ over18: user.age >= 18, age: user.age });
  } catch (err) {
    console.error("DB error on check-age:", err);
    return res.status(400).json({ success: false, message: "userId ไม่ถูกต้อง" });
  }
});

// ==================== ดูหนังสือทั้งหมด (จาก MongoDB) ====================
// รูปแบบ response เหมือน novels.json เดิม ({ novels: [...] }) เพื่อไม่ต้องแก้โค้ด frontend ที่เหลือ
router.get("/books", async (req, res) => {
  try {
    const books = await Book.find({}).sort({ bookId: 1 }).lean();
    const novels = books.map((b) => ({
      id: b.bookId,
      title: b.title,
      author: b.author,
      category: b.category,
      date: b.date,
      word: b.word,
      price: b.price,
      Image: b.Image,
      description: b.description,
      content: b.content,
      chapters: b.chapters && b.chapters.length ? b.chapters : undefined,
      owner: b.owner,
    }));
    res.json({ success: true, novels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== หนังสือของฉัน (ที่เพิ่มเอง) ====================
router.get("/mybooks", async (req, res) => {
  try {
    const owner = req.query.owner;
    if (!owner) return res.json({ success: true, novels: [] });
    const books = await Book.find({ owner }).sort({ createdAt: -1 }).lean();
    const novels = books.map((b) => ({
      id: b.bookId,
      title: b.title,
      author: b.author,
      category: b.category,
      price: b.price,
      cover: b.Image,
      Image: b.Image,
      desc: b.description,
      content: b.content,
      chapters: b.chapters && b.chapters.length ? b.chapters : undefined,
    }));
    res.json({ success: true, novels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== เพิ่มหนังสือใหม่ (อัปโหลดปกขึ้น Cloudinary + บันทึกลง MongoDB) ====================
router.post("/books", upload.single("cover"), async (req, res) => {
  try {
    const { title, author, price, category, desc, content, ownerId } = req.body;
    if (!title || !req.file) {
      return res.json({ success: false, message: "กรุณากรอกชื่อเรื่องและเลือกปกหนังสือ" });
    }

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, "booky/covers");

    const lastBook = await Book.findOne({}).sort({ bookId: -1 }).lean();
    const nextId = lastBook ? lastBook.bookId + 1 : 1;

    const book = await Book.create({
      bookId: nextId,
      title,
      author: author || "",
      category: category || "",
      price: parseFloat(price) || 0,
      Image: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
      description: desc || "",
      content: content || "",
      owner: ownerId || null,
    });

    res.json({ success: true, message: "บันทึกนิยายเรียบร้อย!", book });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== ลบหนังสือที่เพิ่มเอง ====================
router.delete("/books/:bookId", async (req, res) => {
  try {
    const book = await Book.findOne({ bookId: req.params.bookId });
    if (!book) return res.status(404).json({ success: false, message: "ไม่พบหนังสือ" });

    if (book.imagePublicId) {
      try { await cloudinary.uploader.destroy(book.imagePublicId); } catch (e) { /* ignore */ }
    }
    await book.deleteOne();
    res.json({ success: true, message: "ลบหนังสือเรียบร้อย" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
