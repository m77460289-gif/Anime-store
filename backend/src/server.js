"use strict";
require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");

const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.JWT_SECRET || "class-project-secret-change-this";
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "../data/db.json");
const ROOT = path.resolve(__dirname, "../../");
const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];
const starterProducts = [
  { id: 1, name: "پوستر انیمه نیگا", description: "طرح پوستر انیمه از آرشیو تصویری نیگا. قیمت را مدیر فروشگاه تعیین می‌کند.", category: "پوستر انیمه", priceToman: 0, stock: null, imageUrl: "assets/images/gojo-poster.webp", active: true },
  { id: 2, name: "قاب گوشی طرح انیمه", description: "قاب گوشی با طرح انیمه؛ قیمت ثبت‌شده در اطلاعات قبلی فروشگاه.", category: "اکسسوری موبایل", priceToman: 550000, stock: null, imageUrl: "assets/images/deku-phone.webp", active: true }
];

function save(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE + ".tmp", JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(DATA_FILE + ".tmp", DATA_FILE);
}

function load() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  let db;
  if (fs.existsSync(DATA_FILE)) db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  else db = { users: [], products: starterProducts, orders: [], messages: [], nextUserId: 1, nextProductId: 3, nextOrderId: 1, nextMessageId: 1 };
  for (const key of ["users", "products", "orders", "messages"]) if (!Array.isArray(db[key])) db[key] = [];
  db.nextUserId = db.nextUserId || 1;
  db.nextProductId = db.nextProductId || 3;
  db.nextOrderId = db.nextOrderId || 1;
  db.nextMessageId = db.nextMessageId || 1;
  const email = String(process.env.ADMIN_EMAIL || "admin@niga.local").trim().toLowerCase();
  if (!db.users.some(u => u.email === email)) {
    db.users.push({ id: db.nextUserId++, name: "مدیر نیگا", email, passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || "Admin12345!", 10), role: "ADMIN" });
  }
  save(db);
  return db;
}

const clean = value => value == null ? "" : String(value).trim();
const emailOk = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const safeUser = user => ({ id: user.id, name: user.name, email: user.email, role: user.role });
const tokenFor = user => jwt.sign({ sub: String(user.id) }, SECRET, { expiresIn: "12h" });

function createApp(db) {
  const app = express();
  const origins = new Set((process.env.FRONTEND_ORIGIN || "").split(",").map(x => x.trim()).filter(Boolean));
  for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5500", "http://127.0.0.1:5500"]) origins.add(origin);
  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin(origin, cb) { cb(null, !origin || origins.has(origin)); } }));
  app.use(express.json({ limit: "1mb" }));
  const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false });

  const auth = (req, res, next) => {
    const header = req.get("authorization") || "";
    try {
      const payload = jwt.verify(header.startsWith("Bearer ") ? header.slice(7) : "", SECRET);
      req.user = db.users.find(u => u.id === Number(payload.sub));
      if (!req.user) return res.status(401).json({ message: "حساب کاربری پیدا نشد." });
      next();
    } catch { return res.status(401).json({ message: "ابتدا وارد حساب کاربری شو." }); }
  };
  const admin = (req, res, next) => req.user?.role === "ADMIN" ? next() : res.status(403).json({ message: "این بخش فقط برای مدیر فروشگاه است." });
  const manager = [auth, admin];

  app.get("/api/health", (req, res) => res.json({ status: "ok", app: "NIGA Store", runtime: "Node.js" }));
  app.get("/api/products", (req, res) => res.json(db.products.filter(p => p.active !== false)));

  app.post("/api/auth/register", loginLimit, (req, res) => {
    const name = clean(req.body.name), email = clean(req.body.email).toLowerCase(), password = String(req.body.password || "");
    if (name.length < 2 || name.length > 100 || !emailOk(email) || password.length < 8 || password.length > 100)
      return res.status(400).json({ message: "نام، ایمیل معتبر و رمز عبور حداقل ۸ کاراکتری لازم است." });
    if (db.users.some(u => u.email === email)) return res.status(409).json({ message: "این ایمیل قبلاً ثبت شده است." });
    const user = { id: db.nextUserId++, name, email, passwordHash: bcrypt.hashSync(password, 10), role: "CUSTOMER" };
    db.users.push(user); save(db);
    res.status(201).json({ token: tokenFor(user), user: safeUser(user) });
  });

  app.post("/api/auth/login", loginLimit, (req, res) => {
    const email = clean(req.body.email).toLowerCase(), password = String(req.body.password || "");
    const user = db.users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) return res.status(401).json({ message: "ایمیل یا رمز عبور درست نیست." });
    res.json({ token: tokenFor(user), user: safeUser(user) });
  });
  app.get("/api/auth/me", auth, (req, res) => res.json(safeUser(req.user)));

  app.post("/api/orders", auth, (req, res) => {
    const fullName = clean(req.body.fullName), phone = clean(req.body.phone), address = clean(req.body.address);
    const items = req.body.items;
    if (fullName.length < 2 || phone.length < 8 || phone.length > 20 || !/^[0-9۰-۹+() -]+$/.test(phone) || address.length < 8 || !Array.isArray(items) || !items.length)
      return res.status(400).json({ message: "نام، تلفن، نشانی و سبد خرید معتبر لازم است." });
    const quantities = new Map();
    for (const item of items) {
      const id = Number(item.productId), qty = Number(item.quantity);
      if (!Number.isSafeInteger(id) || id < 1 || !Number.isInteger(qty) || qty < 1 || qty > 30) return res.status(400).json({ message: "تعداد محصول معتبر نیست." });
      quantities.set(id, (quantities.get(id) || 0) + qty);
    }
    const checked = []; let totalToman = 0;
    for (const [id, qty] of quantities) {
      const p = db.products.find(x => x.id === id && x.active !== false);
      if (!p) return res.status(404).json({ message: "یکی از محصولات پیدا نشد." });
      if (!Number.isSafeInteger(Number(p.priceToman)) || Number(p.priceToman) <= 0) return res.status(400).json({ message: "قیمت یکی از محصولات مشخص نشده است." });
      if (p.stock != null && Number(p.stock) < qty) return res.status(409).json({ message: "موجودی محصول کافی نیست." });
      totalToman += Number(p.priceToman) * qty;
      if (!Number.isSafeInteger(totalToman)) return res.status(400).json({ message: "مبلغ سفارش معتبر نیست." });
      checked.push({ productId: p.id, productName: p.name, imageUrl: p.imageUrl, unitPriceToman: Number(p.priceToman), quantity: qty });
    }
    for (const item of checked) {
      const p = db.products.find(x => x.id === item.productId);
      if (p.stock != null) p.stock -= item.quantity;
    }
    const order = { id: db.nextOrderId++, userId: req.user.id, customerName: fullName, phone, address, note: clean(req.body.note), items: checked, totalToman, status: "PENDING", createdAt: new Date().toISOString() };
    db.orders.push(order); save(db);
    res.status(201).json({ id: order.id, totalToman, status: order.status, message: "سفارش آموزشی ثبت شد؛ پرداخت واقعی در این پروژه وجود ندارد." });
  });

  app.get("/api/orders/me", auth, (req, res) => res.json(db.orders.filter(o => o.userId === req.user.id).sort((a,b) => b.id-a.id).map(({id,totalToman,status,createdAt}) => ({id,totalToman,status,createdAt}))));
  app.get("/api/admin/orders", ...manager, (req, res) => res.json(db.orders.slice().sort((a,b) => b.id-a.id)));
  app.patch("/api/admin/orders/:id/status", ...manager, (req, res) => {
    const order = db.orders.find(o => o.id === Number(req.params.id)), status = clean(req.body.status).toUpperCase();
    if (!order) return res.status(404).json({ message: "سفارش پیدا نشد." });
    if (!STATUSES.includes(status)) return res.status(400).json({ message: "وضعیت سفارش معتبر نیست." });
    order.status = status; save(db); res.json({ id: order.id, status });
  });

  app.post("/api/admin/products", ...manager, (req, res) => {
    const name = clean(req.body.name), price = Number(req.body.priceToman), stock = req.body.stock == null || req.body.stock === "" ? null : Number(req.body.stock);
    if (name.length < 2 || !Number.isSafeInteger(price) || price < 0 || (stock !== null && (!Number.isInteger(stock) || stock < 0)))
      return res.status(400).json({ message: "نام، قیمت یا موجودی معتبر نیست." });
    const p = { id: db.nextProductId++, name, description: clean(req.body.description), category: clean(req.body.category) || "سایر", priceToman: price, stock, imageUrl: clean(req.body.imageUrl) || "assets/images/gojo-poster.webp", active: true };
    db.products.push(p); save(db); res.status(201).json(p);
  });
  app.put("/api/admin/products/:id", ...manager, (req, res) => {
    const p = db.products.find(x => x.id === Number(req.params.id)), name = clean(req.body.name), price = Number(req.body.priceToman), stock = req.body.stock == null || req.body.stock === "" ? null : Number(req.body.stock);
    if (!p) return res.status(404).json({ message: "محصول پیدا نشد." });
    if (name.length < 2 || !Number.isSafeInteger(price) || price < 0 || (stock !== null && (!Number.isInteger(stock) || stock < 0))) return res.status(400).json({ message: "اطلاعات محصول معتبر نیست." });
    Object.assign(p, { name, description: clean(req.body.description), category: clean(req.body.category) || "سایر", priceToman: price, stock, imageUrl: clean(req.body.imageUrl) || "assets/images/gojo-poster.webp" });
    save(db); res.json(p);
  });
  app.delete("/api/admin/products/:id", ...manager, (req, res) => {
    const p = db.products.find(x => x.id === Number(req.params.id));
    if (!p) return res.status(404).json({ message: "محصول پیدا نشد." });
    p.active = false; save(db); res.json({ id: p.id, message: "محصول غیرفعال شد." });
  });

  app.post("/api/contact", (req, res) => {
    const name = clean(req.body.name), email = clean(req.body.email).toLowerCase(), message = clean(req.body.message);
    if (name.length < 2 || !emailOk(email) || message.length < 2 || message.length > 3000) return res.status(400).json({ message: "نام، ایمیل و متن پیام معتبر لازم است." });
    db.messages.push({ id: db.nextMessageId++, name, email, subject: clean(req.body.subject), message, createdAt: new Date().toISOString() });
    save(db); res.status(201).json({ message: "پیام در فایل محلی ذخیره شد." });
  });

  app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));
  app.use("/assets", express.static(path.join(ROOT, "assets"), { maxAge: "1h" }));
  app.use((req, res) => res.status(404).json({ message: "مسیر موردنظر پیدا نشد." }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(error.status || 500).json({ message: error.status ? error.message : "خطای داخلی سرور رخ داد." });
  });
  return app;
}

if (require.main === module) {
  const app = createApp(load());
  app.listen(PORT, () => console.log("NIGA Store classroom server: http://localhost:" + PORT));
}
module.exports = { createApp, load };
