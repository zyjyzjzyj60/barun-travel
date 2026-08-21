const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { catalog, getPool, initializeDatabase, passwordMatches, enableRailwayDemoFallback } = require("./db");

const PORT = Number(process.env.PORT || 3023);
const PUBLIC_DIR = path.join(__dirname, "public");
const sessions = new Map();
const sendJson = (res, status, data) => { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); res.end(JSON.stringify(data)); };
const sendError = (res, status, message) => sendJson(res, status, { error: message });
const bilingual = (ko, zh) => ({ ko, zh });

function readBody(req) {
  return new Promise((resolve, reject) => {
    let text = "";
    req.on("data", chunk => { text += chunk; if (text.length > 100000) reject(new Error("请求过大")); });
    req.on("end", () => { try { resolve(text ? JSON.parse(text) : {}); } catch { reject(new Error("请求格式无效")); } });
    req.on("error", reject);
  });
}

function cookieValue(req, name) {
  return (req.headers.cookie || "").split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

function requireAdmin(req, res) {
  const token = cookieValue(req, "barun_session");
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    sendError(res, 401, "请先登录后台");
    return null;
  }
  return session;
}

function orderNo() { return `BT${new Date().toISOString().slice(0, 10).replaceAll("-", "")}${crypto.randomBytes(3).toString("hex").toUpperCase()}`; }
function seats(order) { return Number(order.adults) + Number(order.children); }
function dateOnly(value) { return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10); }
function departureView(row) { return { id: row.id, productId: row.product_id, travelDate: dateOnly(row.travel_date), adultPrice: row.adult_price, childPrice: row.child_price, infantPrice: row.infant_price, capacity: row.capacity, reservedSeats: row.reserved_seats, availableSeats: Math.max(0, row.capacity - row.reserved_seats), isOnSale: row.is_on_sale, note: row.note }; }
function asObject(value) { return value && typeof value === "object" ? value : {}; }
function fixtureFor(id) { return catalog.find(product => product.id === id); }

function productCard(row) {
  const content = asObject(row.content);
  return {
    id: row.id,
    title: bilingual(row.title, content.titleZh || row.title),
    subtitle: bilingual(row.subtitle, content.subtitleZh || row.subtitle),
    duration: bilingual(row.duration, content.durationZh || row.duration),
    departure: bilingual(row.departure, content.departureZh || row.departure),
    airline: bilingual(row.airline, content.airlineZh || row.airline),
    destination: bilingual(row.destination, content.destinationZh || row.destination),
    tag: content.tag || bilingual("여행", "旅行"),
    theme: content.theme || "xian",
    heroImage: content.heroImage || ""
  };
}

function productView(row, imageRows) {
  const content = asObject(row.content);
  const fixture = fixtureFor(row.id);
  const fixtureImages = fixture?.images || [];
  const images = imageRows.map(image => {
    const source = fixtureImages.find(item => item.url === image.url);
    return {
      position: image.position,
      url: image.url,
      alt: source?.alt || bilingual(image.alt, image.alt),
      author: image.author,
      sourceUrl: image.source_url,
      license: image.license,
      licenseUrl: image.license_url
    };
  });
  return {
    ...productCard(row),
    description: bilingual(row.description, content.descriptionZh || row.description),
    highlights: row.highlights,
    itinerary: row.itinerary,
    included: row.included,
    excluded: row.excluded,
    notes: row.notes,
    map: content.map || { viewBox: "0 0 1 1", nodes: [] },
    images
  };
}

async function findProduct(id) {
  const row = (await getPool().query("SELECT * FROM products WHERE id=$1", [id])).rows[0];
  if (!row) return null;
  const images = (await getPool().query("SELECT position,url,alt,author,source_url,license,license_url FROM product_images WHERE product_id=$1 ORDER BY position", [id])).rows;
  return productView(row, images);
}

async function productExists(id) {
  return Boolean((await getPool().query("SELECT 1 FROM products WHERE id=$1", [id])).rowCount);
}

async function listDepartures(productId) {
  return (await getPool().query("SELECT * FROM departures WHERE product_id=$1 ORDER BY travel_date", [productId])).rows.map(departureView);
}

async function api(req, res, url) {
  const db = getPool();
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/api/products") {
    const rows = (await db.query("SELECT * FROM products ORDER BY CASE id WHEN 'xian-4d' THEN 1 WHEN 'silkroad-11d' THEN 2 ELSE 99 END, id")).rows;
    return sendJson(res, 200, rows.map(productCard));
  }
  if (req.method === "GET" && pathname === "/api/product") return sendJson(res, 200, await findProduct("xian-4d"));
  if (req.method === "GET" && pathname === "/api/departures") return sendJson(res, 200, await listDepartures(url.searchParams.get("productId") || "xian-4d"));

  const productMatch = pathname.match(/^\/api\/products\/([a-z0-9-]+)$/);
  if (req.method === "GET" && productMatch) {
    const product = await findProduct(productMatch[1]);
    return product ? sendJson(res, 200, product) : sendError(res, 404, "상품을 찾을 수 없습니다 · 未找到该产品");
  }
  const departureMatch = pathname.match(/^\/api\/products\/([a-z0-9-]+)\/departures$/);
  if (req.method === "GET" && departureMatch) {
    if (!(await productExists(departureMatch[1]))) return sendError(res, 404, "상품을 찾을 수 없습니다 · 未找到该产品");
    return sendJson(res, 200, await listDepartures(departureMatch[1]));
  }

  if (req.method === "POST" && pathname === "/api/orders") {
    const body = await readBody(req);
    const productId = String(body.productId || "");
    const adults = Number(body.adults);
    const children = Number(body.children || 0);
    const infants = Number(body.infants || 0);
    const departureId = Number(body.departureId);
    if (!(await productExists(productId))) return sendError(res, 400, "请选择有效的旅游产品");
    if (!Number.isInteger(departureId) || !Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0 || !Number.isInteger(infants) || infants < 0) return sendError(res, 400, "请正确填写出行人数和团期");
    if (![body.contactName, body.contactPhone, body.contactEmail].every(value => typeof value === "string" && value.trim())) return sendError(res, 400, "请填写演示联系人资料");
    const departure = (await db.query("SELECT * FROM departures WHERE id=$1 AND product_id=$2", [departureId, productId])).rows[0];
    if (!departure || !departure.is_on_sale) return sendError(res, 400, "该团期暂不可预订");
    const total = adults * departure.adult_price + children * departure.child_price + infants * departure.infant_price;
    const result = await db.query("INSERT INTO orders (order_no,product_id,departure_id,adults,children,infants,total_price,contact_name,contact_phone,contact_email) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id,order_no", [orderNo(), productId, departureId, adults, children, infants, total, body.contactName.trim(), body.contactPhone.trim(), body.contactEmail.trim()]);
    return sendJson(res, 201, { orderId: result.rows[0].id, orderNo: result.rows[0].order_no, totalPrice: total, demo: true });
  }

  const payMatch = pathname.match(/^\/api\/orders\/(\d+)\/demo-pay$/);
  if (req.method === "POST" && payMatch) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const order = (await client.query("SELECT * FROM orders WHERE id=$1 FOR UPDATE", [Number(payMatch[1])])).rows[0];
      if (!order) { await client.query("ROLLBACK"); return sendError(res, 404, "订单不存在"); }
      if (order.status !== "PENDING_PAYMENT") { await client.query("ROLLBACK"); return sendError(res, 400, "该订单已完成测试支付"); }
      const departure = (await client.query("SELECT * FROM departures WHERE id=$1 AND product_id=$2 FOR UPDATE", [order.departure_id, order.product_id])).rows[0];
      if (!departure || !departure.is_on_sale || departure.capacity - departure.reserved_seats < seats(order)) { await client.query("ROLLBACK"); return sendError(res, 409, "余位不足，无法完成测试支付"); }
      await client.query("UPDATE departures SET reserved_seats=reserved_seats+$1 WHERE id=$2", [seats(order), departure.id]);
      await client.query("UPDATE orders SET status='PAID_PENDING_CONFIRMATION',paid_at=NOW() WHERE id=$1", [order.id]);
      await client.query("COMMIT");
      return sendJson(res, 200, { success: true, orderNo: order.order_no, status: "PAID_PENDING_CONFIRMATION" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  if (req.method === "POST" && pathname === "/api/admin/login") {
    const body = await readBody(req);
    const user = (await db.query("SELECT * FROM admin_users WHERE username=$1", [String(body.username || "")])).rows[0];
    if (!user || !(await passwordMatches(String(body.password || ""), user.password_hash))) return sendError(res, 401, "账号或密码错误，或尚未配置管理员账号");
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { username: user.username, expiresAt: Date.now() + 28800000 });
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Set-Cookie": `barun_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800;${process.env.NODE_ENV === "production" ? " Secure;" : ""}` });
    return res.end(JSON.stringify({ username: user.username }));
  }
  if (req.method === "POST" && pathname === "/api/admin/logout") {
    const token = cookieValue(req, "barun_session");
    if (token) sessions.delete(token);
    res.writeHead(204, { "Set-Cookie": "barun_session=; Path=/; HttpOnly; Max-Age=0" });
    return res.end();
  }
  if (req.method === "GET" && pathname === "/api/admin/session") {
    const session = requireAdmin(req, res);
    if (session) sendJson(res, 200, { username: session.username });
    return;
  }
  if (!pathname.startsWith("/api/admin/")) return false;
  if (!requireAdmin(req, res)) return true;

  if (req.method === "GET" && pathname === "/api/admin/products") {
    const rows = (await db.query("SELECT * FROM products ORDER BY id")).rows;
    return sendJson(res, 200, rows.map(productCard));
  }
  if (req.method === "GET" && pathname === "/api/admin/departures") {
    const productId = url.searchParams.get("productId");
    if (!productId || !(await productExists(productId))) return sendError(res, 400, "请选择有效的产品");
    return sendJson(res, 200, await listDepartures(productId));
  }
  if (req.method === "POST" && pathname === "/api/admin/departures") {
    const body = await readBody(req);
    const productId = String(body.productId || "");
    const values = [String(body.travelDate || ""), Number(body.adultPrice), Number(body.childPrice), Number(body.infantPrice), Number(body.capacity), Boolean(body.isOnSale), String(body.note || "")];
    if (!(await productExists(productId))) return sendError(res, 400, "请选择有效的产品");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values[0]) || values.slice(1, 5).some(value => !Number.isInteger(value) || value < 0) || values[4] < 1) return sendError(res, 400, "请完整填写日期、价格和可售名额");
    try {
      const row = (await db.query("INSERT INTO departures (product_id,travel_date,adult_price,child_price,infant_price,capacity,is_on_sale,note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *", [productId, ...values])).rows[0];
      return sendJson(res, 201, departureView(row));
    } catch (error) {
      if (error.code === "23505") return sendError(res, 409, "该产品的这个出发日期已存在");
      throw error;
    }
  }
  const adminDepartureMatch = pathname.match(/^\/api\/admin\/departures\/(\d+)$/);
  if (req.method === "PUT" && adminDepartureMatch) {
    const body = await readBody(req);
    const values = [Number(body.adultPrice), Number(body.childPrice), Number(body.infantPrice), Number(body.capacity), Boolean(body.isOnSale), String(body.note || ""), Number(adminDepartureMatch[1])];
    if (values.slice(0, 4).some(value => !Number.isInteger(value) || value < 0) || values[3] < 1) return sendError(res, 400, "价格和可售名额无效");
    const row = (await db.query("UPDATE departures SET adult_price=$1,child_price=$2,infant_price=$3,capacity=$4,is_on_sale=$5,note=$6 WHERE id=$7 RETURNING *", values)).rows[0];
    return row ? sendJson(res, 200, departureView(row)) : sendError(res, 404, "团期不存在");
  }
  if (req.method === "GET" && pathname === "/api/admin/orders") {
    const rows = (await db.query("SELECT o.id,o.order_no AS \"orderNo\",o.product_id AS \"productId\",p.title AS \"productTitle\",o.adults,o.children,o.infants,o.total_price AS \"totalPrice\",o.contact_name AS \"contactName\",o.contact_phone AS \"contactPhone\",o.contact_email AS \"contactEmail\",o.status,o.created_at AS \"createdAt\",d.travel_date AS \"travelDate\" FROM orders o JOIN departures d ON d.id=o.departure_id JOIN products p ON p.id=o.product_id ORDER BY o.created_at DESC")).rows;
    return sendJson(res, 200, rows);
  }
  return sendError(res, 404, "接口不存在");
}

function serveStatic(req, res, pathname) {
  const relative = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  if (relative.includes("..")) return sendError(res, 403, "禁止访问");
  const file = path.join(PUBLIC_DIR, relative);
  if (!file.startsWith(PUBLIC_DIR) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    return res.end("<h1>404</h1><p>Page not found.</p>");
  }
  const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
  res.writeHead(200, { "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}

function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      if (url.pathname.startsWith("/api/")) {
        const handled = await api(req, res, url);
        if (handled !== false) return;
      }
      if (!["GET", "HEAD"].includes(req.method)) return sendError(res, 405, "不支持该请求方式");
      serveStatic(req, res, url.pathname);
    } catch (error) {
      console.error(error);
      if (!res.headersSent) sendError(res, 500, "服务器暂时无法处理请求");
      else res.end();
    }
  });
}

async function start() {
  try {
    await initializeDatabase();
  } catch (error) {
    if (!process.env.RAILWAY_PROJECT_ID) throw error;
    console.error("[demo] Database startup failed; starting the public demo with ephemeral data:", error.message);
    await enableRailwayDemoFallback();
    await initializeDatabase();
  }
  createServer().listen(PORT, "0.0.0.0", () => console.log(`바른투어 데모가 시작되었습니다: http://localhost:${PORT}`));
}

if (require.main === module) start().catch(error => { console.error(error); process.exitCode = 1; });

module.exports = { createServer, start, productCard, productView };
