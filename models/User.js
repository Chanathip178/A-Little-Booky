const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // เก็บเป็น bcrypt hash เท่านั้น
  age: { type: Number, required: true },
  purchasedBooks: { type: [String], default: [] }, // เก็บ bookId (String) ของหนังสือที่ซื้อแล้ว
  favorites: { type: [Number], default: [] }, // เก็บ bookId (Number) ของนิยายที่กดถูกใจ
  cart: {
    type: [{
      bookId: { type: Number, required: true },
      qty: { type: Number, default: 1 },
      _id: false,
    }],
    default: [],
  }, // ตะกร้าสินค้าที่ผูกกับบัญชี (sync ข้ามอุปกรณ์ได้)
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
