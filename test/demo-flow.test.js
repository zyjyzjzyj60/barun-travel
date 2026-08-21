const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const port = 3400 + (process.pid % 500);
const origin = `http://127.0.0.1:${port}`;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const payload = response.status === 204 ? null : await response.json();
  assert.ok(response.ok, payload?.error || `HTTP ${response.status}`);
  return { response, payload };
}

test("本地演示版：团期、测试订单与测试支付完整流转", async t => {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, LOCAL_DEMO: "1", ADMIN_INITIAL_PASSWORD: "test-only-password", PORT: String(port) },
    stdio: "ignore"
  });
  t.after(() => child.kill());
  for (let attempts = 0; attempts < 30; attempts += 1) {
    try { if ((await fetch(`${origin}/api/product`)).ok) break; } catch { await wait(100); }
    await wait(100);
  }
  const login = await fetchJson(`${origin}/api/admin/login`, { method: "POST", body: JSON.stringify({ username: "admin", password: "test-only-password" }) });
  const cookie = login.response.headers.get("set-cookie").split(";")[0];
  const departure = await fetchJson(`${origin}/api/admin/departures`, { method: "POST", headers: { cookie }, body: JSON.stringify({ productId: "xian-4d", travelDate: "2026-12-12", adultPrice: 949000, childPrice: 949000, infantPrice: 200000, capacity: 5, isOnSale: true, note: "test" }) });
  assert.equal(departure.payload.travelDate, "2026-12-12");
  const order = await fetchJson(`${origin}/api/orders`, { method: "POST", body: JSON.stringify({ productId: "xian-4d", departureId: departure.payload.id, adults: 2, children: 1, infants: 0, contactName: "测试用户", contactPhone: "010-0000-0000", contactEmail: "demo@example.com" }) });
  assert.equal(order.payload.totalPrice, 2847000);
  const payment = await fetchJson(`${origin}/api/orders/${order.payload.orderId}/demo-pay`, { method: "POST", body: "{}" });
  assert.equal(payment.payload.status, "PAID_PENDING_CONFIRMATION");
  const departures = await fetchJson(`${origin}/api/products/xian-4d/departures`);
  assert.equal(departures.payload.find(item => item.id === departure.payload.id).availableSeats, 2);
});
