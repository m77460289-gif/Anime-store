"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const dataFile = path.join(os.tmpdir(), "niga-api-test-" + process.pid + ".json");
process.env.DATA_FILE = dataFile;
process.env.JWT_SECRET = "test-secret-only";
process.env.ADMIN_EMAIL = "admin@test.local";
process.env.ADMIN_PASSWORD = "Admin12345!";
const { createApp, load } = require("../src/server");
const app = createApp(load());

test("register, login, products, orders and contact API", async t => {
  const server = app.listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  t.after(async () => {
    server.closeAllConnections?.();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(dataFile, { force: true });
    fs.rmSync(dataFile + ".tmp", { force: true });
  });
  async function request(route, options = {}) {
    const response = await fetch(base + route, options);
    return { response, body: await response.json() };
  }
  const health = await request("/api/health");
  assert.equal(health.body.runtime, "Node.js");
  const products = await request("/api/products");
  assert.equal(products.response.status, 200);
  assert.equal(products.body.length, 2);
  const registered = await request("/api/auth/register", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "کاربر آزمایشی", email: "student@example.com", password: "TestPass123" })
  });
  assert.equal(registered.response.status, 201);
  assert.ok(registered.body.token);
  const headers = { "content-type": "application/json", authorization: "Bearer " + registered.body.token };
  const profile = await request("/api/auth/me", { headers });
  assert.equal(profile.body.email, "student@example.com");
  const order = await request("/api/orders", {
    method: "POST", headers,
    body: JSON.stringify({ fullName: "کاربر آزمایشی", phone: "09120000000", address: "تهران، خیابان نمونه، پلاک ۱", items: [{ productId: 2, quantity: 1 }] })
  });
  assert.equal(order.response.status, 201);
  assert.equal(order.body.totalToman, 550000);
  const orders = await request("/api/orders/me", { headers });
  assert.equal(orders.body.length, 1);
  const contact = await request("/api/contact", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "دانش‌آموز", email: "student@example.com", message: "پیام آزمایشی" })
  });
  assert.equal(contact.response.status, 201);
  const admin = await request("/api/auth/login", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@test.local", password: "Admin12345!" })
  });
  assert.equal(admin.response.status, 200);
  const adminOrders = await request("/api/admin/orders", {
    headers: { authorization: "Bearer " + admin.body.token }
  });
  assert.equal(adminOrders.response.status, 200);
  assert.equal(adminOrders.body.length, 1);
});
