const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { getPool, initializeDatabase, passwordMatches } = require("./db");

const PORT = Number(process.env.PORT || 3023);
const PUBLIC_DIR = path.join(__dirname, "public");
const sessions = new Map();
const sendJson = (res, status, data) => { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); res.end(JSON.stringify(data)); };
const sendError = (res, status, message) => sendJson(res, status, { error: message });
function readBody(req) { return new Promise((resolve, reject) => { let text = ""; req.on("data", c => { text += c; if (text.length > 100000) reject(new Error("请求过大")); }); req.on("end", () => { try { resolve(text ? JSON.parse(text) : {}); } catch { reject(new Error("请求格式无效")); } }); req.on("error", reject); }); }
function cookieValue(req, name) { return (req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1); }
function requireAdmin(req, res) { const token = cookieValue(req, "barun_session"); const session = token && sessions.get(token); if (!session || session.expiresAt < Date.now()) { if (token) sessions.delete(token); sendError(res, 401, "请先登录后台"); return null; } return session; }
function orderNo() { return `BT${new Date().toISOString().slice(0, 10).replaceAll("-", "")}${crypto.randomBytes(3).toString("hex").toUpperCase()}`; }
function seats(order) { return Number(order.adults) + Number(order.children); }
function dateOnly(value) { return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10); }
function departureView(row) { return { id: row.id, travelDate: dateOnly(row.travel_date), adultPrice: row.adult_price, childPrice: row.child_price, infantPrice: row.infant_price, capacity: row.capacity, reservedSeats: row.reserved_seats, availableSeats: Math.max(0, row.capacity - row.reserved_seats), isOnSale: row.is_on_sale, note: row.note }; }

async function getProduct() {
  const db = getPool();
  const product = (await db.query("SELECT * FROM products WHERE id='xian-4d'")).rows[0];
  const images = (await db.query("SELECT position,url,alt,author,source_url AS \"sourceUrl\",license,license_url AS \"licenseUrl\" FROM product_images WHERE product_id='xian-4d' ORDER BY position")).rows;
  return { id: product.id, title: product.title, subtitle: product.subtitle, duration: product.duration, departure: product.departure, airline: product.airline, destination: product.destination, description: product.description, highlights: product.highlights, itinerary: product.itinerary, included: product.included, excluded: product.excluded, notes: product.notes, images };
}

async function api(req, res, url) {
  const db = getPool(); const p = url.pathname;
  if (req.method === "GET" && p === "/api/product") return sendJson(res, 200, await getProduct());
  if (req.method === "GET" && p === "/api/departures") return sendJson(res, 200, (await db.query("SELECT * FROM departures WHERE product_id='xian-4d' ORDER BY travel_date")).rows.map(departureView));
  if (req.method === "POST" && p === "/api/orders") {
    const body = await readBody(req); const adults = Number(body.adults), children = Number(body.children || 0), infants = Number(body.infants || 0), departureId = Number(body.departureId);
    if (!Number.isInteger(departureId) || !Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0 || !Number.isInteger(infants) || infants < 0) return sendError(res, 400, "请正确填写出行人数和团期");
    if (![body.contactName, body.contactPhone, body.contactEmail].every(v => typeof v === "string" && v.trim())) return sendError(res, 400, "请填写演示联系人资料");
    const departure = (await db.query("SELECT * FROM departures WHERE id=$1 AND product_id='xian-4d'", [departureId])).rows[0];
    if (!departure || !departure.is_on_sale) return sendError(res, 400, "该团期暂不可预订");
    const total = adults * departure.adult_price + children * departure.child_price + infants * departure.infant_price;
    const result = await db.query("INSERT INTO orders (order_no,product_id,departure_id,adults,children,infants,total_price,contact_name,contact_phone,contact_email) VALUES ($1,'xian-4d',$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,order_no", [orderNo(), departureId, adults, children, infants, total, body.contactName.trim(), body.contactPhone.trim(), body.contactEmail.trim()]);
    return sendJson(res, 201, { orderId: result.rows[0].id, orderNo: result.rows[0].order_no, totalPrice: total, demo: true });
  }
  const pay = p.match(/^\/api\/orders\/(\d+)\/demo-pay$/);
  if (req.method === "POST" && pay) {
    const client = await db.connect();
    try { await client.query("BEGIN"); const order = (await client.query("SELECT * FROM orders WHERE id=$1 FOR UPDATE", [Number(pay[1])])).rows[0];
      if (!order) { await client.query("ROLLBACK"); return sendError(res, 404, "订单不存在"); }
      if (order.status !== "PENDING_PAYMENT") { await client.query("ROLLBACK"); return sendError(res, 400, "该订单已完成测试支付"); }
      const departure = (await client.query("SELECT * FROM departures WHERE id=$1 FOR UPDATE", [order.departure_id])).rows[0];
      if (!departure.is_on_sale || departure.capacity - departure.reserved_seats < seats(order)) { await client.query("ROLLBACK"); return sendError(res, 409, "余位不足，无法完成测试支付"); }
      await client.query("UPDATE departures SET reserved_seats=reserved_seats+$1 WHERE id=$2", [seats(order), departure.id]);
      await client.query("UPDATE orders SET status='PAID_PENDING_CONFIRMATION',paid_at=NOW() WHERE id=$1", [order.id]); await client.query("COMMIT");
      return sendJson(res, 200, { success: true, orderNo: order.order_no, status: "PAID_PENDING_CONFIRMATION" });
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
  if (req.method === "POST" && p === "/api/admin/login") {
    const body = await readBody(req); const user = (await db.query("SELECT * FROM admin_users WHERE username=$1", [String(body.username || "")])).rows[0];
    if (!user || !(await passwordMatches(String(body.password || ""), user.password_hash))) return sendError(res, 401, "账号或密码错误，或尚未配置管理员账号");
    const token = crypto.randomBytes(32).toString("hex"); sessions.set(token, { username: user.username, expiresAt: Date.now() + 28800000 });
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Set-Cookie": `barun_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800;${process.env.NODE_ENV === "production" ? " Secure;" : ""}` }); return res.end(JSON.stringify({ username: user.username }));
  }
  if (req.method === "POST" && p === "/api/admin/logout") { const token = cookieValue(req, "barun_session"); if (token) sessions.delete(token); res.writeHead(204, { "Set-Cookie": "barun_session=; Path=/; HttpOnly; Max-Age=0" }); return res.end(); }
  if (req.method === "GET" && p === "/api/admin/session") { const session = requireAdmin(req, res); if (session) sendJson(res, 200, { username: session.username }); return; }
  if (!p.startsWith("/api/admin/")) return false;
  if (!requireAdmin(req, res)) return true;
  if (req.method === "GET" && p === "/api/admin/departures") return sendJson(res, 200, (await db.query("SELECT * FROM departures WHERE product_id='xian-4d' ORDER BY travel_date")).rows.map(departureView));
  if (req.method === "POST" && p === "/api/admin/departures") {
    const b = await readBody(req); const values = [String(b.travelDate || ""), Number(b.adultPrice), Number(b.childPrice), Number(b.infantPrice), Number(b.capacity), Boolean(b.isOnSale), String(b.note || "")];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values[0]) || values.slice(1, 5).some(v => !Number.isInteger(v) || v < 0) || values[4] < 1) return sendError(res, 400, "请完整填写日期、价格和可售名额");
    try { return sendJson(res, 201, departureView((await db.query("INSERT INTO departures (product_id,travel_date,adult_price,child_price,infant_price,capacity,is_on_sale,note) VALUES ('xian-4d',$1,$2,$3,$4,$5,$6,$7) RETURNING *", values)).rows[0])); } catch (e) { if (e.code === "23505") return sendError(res, 409, "该出发日期已存在"); throw e; }
  }
  const update = p.match(/^\/api\/admin\/departures\/(\d+)$/);
  if (req.method === "PUT" && update) {
    const b = await readBody(req); const values = [Number(b.adultPrice), Number(b.childPrice), Number(b.infantPrice), Number(b.capacity), Boolean(b.isOnSale), String(b.note || ""), Number(update[1])];
    if (values.slice(0, 4).some(v => !Number.isInteger(v) || v < 0) || values[3] < 1) return sendError(res, 400, "价格和可售名额无效");
    const row = (await db.query("UPDATE departures SET adult_price=$1,child_price=$2,infant_price=$3,capacity=$4,is_on_sale=$5,note=$6 WHERE id=$7 RETURNING *", values)).rows[0]; return row ? sendJson(res, 200, departureView(row)) : sendError(res, 404, "团期不存在");
  }
  if (req.method === "GET" && p === "/api/admin/orders") return sendJson(res, 200, (await db.query("SELECT o.id,o.order_no AS \"orderNo\",o.adults,o.children,o.infants,o.total_price AS \"totalPrice\",o.contact_name AS \"contactName\",o.contact_phone AS \"contactPhone\",o.contact_email AS \"contactEmail\",o.status,o.created_at AS \"createdAt\",d.travel_date AS \"travelDate\" FROM orders o JOIN departures d ON d.id=o.departure_id ORDER BY o.created_at DESC")).rows);
  return sendError(res, 404, "接口不存在");
}

function serveStatic(res, pathname) {
  const relative = (pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, ""));
  if (relative.includes("..")) return sendError(res, 403, "禁止访问"); const file = path.join(PUBLIC_DIR, relative);
  if (!file.startsWith(PUBLIC_DIR) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }); return res.end("<h1>404</h1><p>页面不存在。</p>"); }
  const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
  res.writeHead(200, { "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream", "X-Content-Type-Options": "nosniff" }); fs.createReadStream(file).pipe(res);
}

initializeDatabase().then(() => {
  const server = http.createServer(async (req, res) => { try { const url = new URL(req.url, `http://${req.headers.host || "localhost"}`); if (url.pathname.startsWith("/api/")) { const handled = await api(req, res, url); if (handled !== false) return; } if (!["GET", "HEAD"].includes(req.method)) return sendError(res, 405, "不支持该请求方式"); serveStatic(res, url.pathname); } catch (error) { console.error(error); if (!res.headersSent) sendError(res, 500, "服务器暂时无法处理请求"); else res.end(); } });
  server.listen(PORT, "0.0.0.0", () => console.log(`巴伦旅游演示站已启动：http://localhost:${PORT}`));
}).catch(error => { console.error("数据库初始化失败：", error.message); process.exit(1); });
