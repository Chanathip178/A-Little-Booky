require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const port = process.env.PORT || 3000;

const connectDB = require("./config/db");

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// อ่าน JSON body
app.use(express.json());

// import routes
const shopRoutes = require("./routes/shop");
const adminRoutes = require("./routes/admin");
app.use("/api/shop", shopRoutes);
app.use("/api/admin", adminRoutes);

// หน้า navbar
app.get("/navbar", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "navbar.html"));
});

// หน้า navbar สำหรับ home
app.get("/navbar-main", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "navbar-main.html"));
});

//หน้า Reading
app.get("/reading", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "reading.html"));
});

//หน้า Writing
app.get("/writing", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "writing.html"));
});

// หน้า pre-login
app.get("/pre-login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "pre-login.html"));
});

// หน้า fav
app.get("/fav", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "fav.html"));
});

// หน้า cart
app.get("/cart", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "cart.html"));
});

// redirect ไปหน้า pre-login
app.get("/", (req, res) => {
  res.redirect("/pre-login");
});

// หน้า home
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "home.html"));
});

// หน้า detail
app.get("/detail", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "detail.html"));
});

app.get("/logout", (req, res) => {
  res.redirect("/pre-login");
});

app.get("/content", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "content.html"));
});

app.get("/add-book", (req, res) => {
  res.sendFile(path.resolve(__dirname, "views", "add-book.html"));
});

app.get("/payment", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "payment.html"));
});

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
  });
});
