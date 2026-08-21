process.env.LOCAL_DEMO = "1";
process.env.ADMIN_INITIAL_PASSWORD = "local-test-password";

const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const { initializeDatabase } = require("../db");
const { createServer } = require("../server");

let server;
let baseUrl;

async function json(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = response.status === 204 ? null : await response.json();
  return { response, payload };
}

before(async () => {
  await initializeDatabase();
  server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => new Promise(resolve => server.close(resolve)));

test("publishes the two catalog routes with complete day counts", async () => {
  const { response, payload } = await json("/api/products");
  assert.equal(response.status, 200);
  assert.deepEqual(payload.map(product => product.id), ["xian-4d", "silkroad-11d"]);
  const [xian, silk] = await Promise.all([json("/api/products/xian-4d"), json("/api/products/silkroad-11d")]);
  assert.equal(xian.payload.itinerary.length, 4);
  assert.equal(silk.payload.itinerary.length, 11);
  assert.equal(xian.payload.title.ko.length > 0, true);
  assert.equal(silk.payload.title.zh.length > 0, true);
});

test("calculates and reserves a test order against its selected product departure", async () => {
  const { payload: departures } = await json("/api/products/silkroad-11d/departures");
  const departure = departures[0];
  const { response, payload: order } = await json("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: "silkroad-11d", departureId: departure.id, adults: 2, children: 1, infants: 1, contactName: "테스트", contactPhone: "010-0000-0000", contactEmail: "test@example.com" })
  });
  assert.equal(response.status, 201);
  assert.equal(order.totalPrice, departure.adultPrice * 2 + departure.childPrice + departure.infantPrice);
  const paid = await json(`/api/orders/${order.orderId}/demo-pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(paid.response.status, 200);
  const { payload: updatedDepartures } = await json("/api/products/silkroad-11d/departures");
  assert.equal(updatedDepartures[0].reservedSeats, 3);
});
