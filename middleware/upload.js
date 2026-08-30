const multer = require("multer");

// เก็บไฟล์ไว้ใน memory ก่อน แล้วค่อยอัปโหลดขึ้น Cloudinary ต่อใน route (ไม่เขียนลงดิสก์)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB ต่อไฟล์
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("ไฟล์ต้องเป็นรูปภาพเท่านั้น"));
  },
});

module.exports = upload;
