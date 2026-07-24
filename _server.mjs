
var require = (await import("node:module")).createRequire(import.meta.url);
(async () => {
   const http = require("http");
 const fs = require("fs");
 const path = require("path");
 
 const PORT = 3023;
 const DATA_DIR = path.join(__dirname, "data");
 const PUBLIC_DIR = path.join(__dirname, "public");
 
 function readJSON(file) {
   try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8")); }
   catch { return file.endsWith("reservations.json") ? [] : null; }
 }
 function writeJSON(file, data) {
   fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), "utf-8");
 }
 function serveFile(res, filePath, contentType = "text/html; charset=utf-8") {
   try {
     const content = fs.readFileSync(path.join(PUBLIC_DIR, filePath), "utf-8");
     res.writeHead(200, { "Content-Type": contentType });
     res.end(content);
   } catch {
     res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
     res.end("<h1>404 - 페이지를 찾을 수 없습니다</h1>");
   }
 }
 
 function parseBody(req) {
   return new Promise((resolve) => {
     let body = "";
     req.on("data", c => body += c);
     req.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
   });
 }
 
 function generateCalendarDates(basePrice, months) {
   const dates = [];
   const now = new Date();
   for (let m = 0; m < (months || 3); m++) {
     const year = now.getFullYear();
     const month = now.getMonth() + 1 + m;
     const days = new Date(year, month, 0).getDate();
     for (let d = 1; d <= days; d++) {
       const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
       const dow = new Date(year, month - 1, d).getDay();
       const price = (dow === 0 || dow === 6) ? Math.round(basePrice * 1.1 / 10000) * 10000 : basePrice;
       dates.push({ date: dateStr, price, available: true });
     }
   }
   return dates;
 }
 
 function renderPage(template, data) {
   let html = template;
   for (const key in data) {
     html = html.replaceAll(`{{${key}}}`, data[key]);
   }
   return html;
 }
 
 const server = http.createServer(async (req, res) => {
   const url = new URL(req.url, `http://${req.headers.host}`);
   const pathname = url.pathname;
   const method = req.method;
 
   // API Routes
   if (pathname === "/api/products" && method === "GET") {
     const products = readJSON("products.json");
     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify(products));
     return;
   }
   if (pathname.startsWith("/api/products/") && method === "GET") {
     const id = parseInt(pathname.split("/").pop());
     const products = readJSON("products.json");
     const product = products.find(p => p.id === id);
     if (!product) { res.writeHead(404); res.end("{}"); return; }
     product.dates = generateCalendarDates(product.priceAdult, 3);
     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify(product));
     return;
   }
   if (pathname === "/api/categories" && method === "GET") {
     const cats = readJSON("categories.json");
     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify(cats));
     return;
   }
   if (pathname === "/api/reservations" && method === "POST") {
     const body = await parseBody(req);
     const reservations = readJSON("reservations.json");
     const reservation = {
       id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
       ...body, status: "pending", createdAt: new Date().toISOString()
     };
     reservations.push(reservation);
     writeJSON("reservations.json", reservations);
     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify({ success: true, id: reservation.id }));
     return;
   }
   if (pathname === "/api/admin/reservations" && method === "GET") {
     const reservations = readJSON("reservations.json");
     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify(reservations));
     return;
   }
   if (pathname === "/api/admin/reservations" && method === "POST") {
     const body = await parseBody(req);
     const reservations = readJSON("reservations.json");
     const idx = reservations.findIndex(r => r.id === body.id);
     if (idx >= 0) {
       reservations[idx].status = body.status;
       writeJSON("reservations.json", reservations);
     }
     res.writeHead(200);
     res.end(JSON.stringify({ success: true }));
     return;
   }
   if (pathname === "/api/admin/login" && method === "POST") {
     const body = await parseBody(req);
     const ok = body.id === "admin" && body.pw === "barun1234";
     res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
     res.end(JSON.stringify({ success: ok }));
     return;
   }
 
   // Serve static files from /public
   const publicPath = path.join(PUBLIC_DIR, pathname === "/" ? "index.html" : pathname);
   if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
     const extMap = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
     const ext = path.extname(publicPath);
     serveFile(res, pathname === "/" ? "index.html" : pathname.slice(1), extMap[ext] || "text/plain");
     return;
   }
 
   // Catch-all: serve index.html for SPA-style routes
   serveFile(res, "index.html");
 });
 
 server.listen(PORT, "0.0.0.0", () => {
   console.log(`🌐 바른투어 서버 시작됨: http://localhost:${PORT}`);
   console.log(`📋 관리자 로그인: http://localhost:${PORT}/admin.html`);
 });

  // Keep alive  
})().catch(e => console.error(e));
