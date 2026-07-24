 const http = require("http");
 const fs = require("fs");
 const path = require("path");
 
const PORT = process.env.PORT || 3023;
const DATA_DIR = __dirname;
const PUBLIC_DIR = __dirname;
 
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
 


   // Homepage with full server-side rendering
   if (pathname === "/" && method === "GET") {
     const cats = readJSON("categories.json");
     const prods = readJSON("products.json");
     let html = fs.readFileSync(path.join(PUBLIC_DIR, "index.html"), "utf-8");
     html = html.replace("id=\"categoryGrid\" class=\"grid-categories\">加载中...", "id=\"categoryGrid\">" + cats.map(function(c){return "<div class=\'cat-card\' data-code=\'" + c.code + "\' onclick=\'scrollToCategory(\'" + c.code + "\')\'>" + "<div class=\'emoji\'>🏯</div><div class=\'name\'>" + c.name + "</div><div class=\'desc\'>" + c.description + "</div></div>";}).join(""));
     html = html.replace("id=\"productGrid\" class=\"product-grid\">加载中...", "id=\"productGrid\">" + prods.map(function(p){return "<a href=\'/product?id=" + p.id + "\' class=\'product-card\'>" + "<div class=\'product-img\'><div><div class=\'big-emoji\'>🏯</div><div class=\'dest\'>" + (p.destination || "") + "</div></div>" + (p.featured ? "<span class=\'badge\'>热卖</span>" : "") + "</div><div class=\'product-body\'><div class=\'tags\'>" + (p.tags||[]).slice(0,3).map(function(t){return "<span class=\'tag\'>"+t+"</span>";}).join("") + "</div><div class=\'product-title\'>" + p.title + "</div><div class=\'product-meta\'><span>" + (p.duration||"") + "</span><span>|</span><span>" + (p.airline||"") + "</span></div><div class=\'product-footer\'><div><div class=\'price-label\'>成人1人基准</div><div class=\'price\'>" + (p.priceAdult?p.priceAdult.toLocaleString():"") + "<span class=\'price-unit\'>원</span></div></div><span class=\'product-link\'>查看详情 →</span></div></div></a>";}).join(""));
     html = html.replace("id=\"filterPills\"></div>", "id=\"filterPills\">" + "<span class=\'filter-pill active\' data-code=\'\' onclick=\'scrollToCategory(null)\'>全部分类</span>" + cats.map(function(c){return "<span class=\'filter-pill\' data-code=\'" + c.code + "\' onclick=\'scrollToCategory(\'" + c.code + "\')\'>" + c.name + "</span>";}).join("") + "</div>");
     html = html.replace("function loadData() {", "function loadData() {/* SSR */}");
     res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
     res.end(html);
     return;
   }
   
   // Product page with data injection
   if (pathname === "/product" && method === "GET") {
     const url = new URL(req.url, "http://" + req.headers.host);
     const id = parseInt(url.searchParams.get("id"));
     if (!id) { serveFile(res, "index.html"); return; }
     const prods = readJSON("products.json");
     const prod = prods.find(function(p) { return p.id === id; });
     if (!prod) { serveFile(res, "index.html"); return; }
     let html = fs.readFileSync(path.join(PUBLIC_DIR, "product.html"), "utf-8");
     html = html.replace("</head>", '<script>var __DATA__=' + JSON.stringify(prod) + ';</script></head>');
     html = html.replace("async function load() {", "function load() {");
     html = html.replace("var res = await fetch(\"/api/products/\" + id);", "");
     html = html.replace("var p = await res.json();", "var p = __DATA__;");
     res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
     res.end(html);
     return;
   }

   // Product page with data injection
   if (pathname === "/product" && method === "GET") {
     const url = new URL(req.url, "http://" + req.headers.host);
     const id = parseInt(url.searchParams.get("id"));
     if (!id) { serveFile(res, "index.html"); return; }
     const prods = readJSON("products.json");
     const prod = prods.find(function(p) { return p.id === id; });
     if (!prod) { serveFile(res, "index.html"); return; }
     let html = fs.readFileSync(path.join(PUBLIC_DIR, "product.html"), "utf-8");
     html = html.replace("</head>", '<script>var __DATA__=' + JSON.stringify(prod) + ';</script></head>');
     html = html.replace("async function load() {", "function load() {");
     html = html.replace("var res = await fetch(\"/api/products/\" + id);", "");
     html = html.replace("var p = await res.json();", "var p = __DATA__;");
     res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
     res.end(html);
     return;
   }
// Serve static files from /public (try .html fallback)
   let fp = pathname === "/" ? "index.html" : pathname;
   let pp = path.join(PUBLIC_DIR, fp);
   if (!fs.existsSync(pp) || !fs.statSync(pp).isFile()) {
     const htmlFp = pathname === "/" ? "index.html" : pathname.slice(1) + ".html";
     const htmlPp = path.join(PUBLIC_DIR, htmlFp);
     if (fs.existsSync(htmlPp) && fs.statSync(htmlPp).isFile()) {
       fp = htmlFp;
       pp = htmlPp;
     }

   // Admin: create product
   if (pathname === "/api/admin/products/create" && method === "POST") {
     const body = await parseBody(req);
     const products = readJSON("products.json");
     body.id = Date.now();
     body.rating = 0;
     body.reviewCount = 0;
     body.featured = body.featured || false;
     products.push(body);
     writeJSON("products.json", products);
     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify({ success: true, id: body.id }));
     return;
   }
   // Admin: update product
   if (pathname === "/api/admin/products/update" && method === "POST") {
     const body = await parseBody(req);
     const products = readJSON("products.json");
     const idx = products.findIndex(p => p.id === body.id);
     if (idx >= 0) {
       Object.assign(products[idx], body);
       writeJSON("products.json", products);
       res.writeHead(200, { "Content-Type": "application/json" });
       res.end(JSON.stringify({ success: true }));
       return;
     }
     res.writeHead(404);
     res.end(JSON.stringify({ success: false }));
     return;
   }
   // Admin: delete product
   if (pathname === "/api/admin/products/delete" && method === "POST") {
     const body = await parseBody(req);
     let products = readJSON("products.json");
     products = products.filter(p => p.id !== body.id);
     writeJSON("products.json", products);
     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify({ success: true }));
     return;
   }
   // Admin: create category
   if (pathname === "/api/admin/categories/create" && method === "POST") {
     const body = await parseBody(req);
     const cats = readJSON("categories.json");
     cats.push(body);
     writeJSON("categories.json", cats);
     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify({ success: true }));
     return;
   }
   // Admin: update category
   if (pathname === "/api/admin/categories/update" && method === "POST") {
     const body = await parseBody(req);
     const cats = readJSON("categories.json");
     const idx = cats.findIndex(c => c.code === body.oldCode);
     if (idx >= 0) {
       cats[idx] = { code: body.code, name: body.name, description: body.description };
       writeJSON("categories.json", cats);
       res.writeHead(200, { "Content-Type": "application/json" });
       res.end(JSON.stringify({ success: true }));
       return;
     }
     res.writeHead(404);
     res.end(JSON.stringify({ success: false }));
     return;
   }
   // Admin: delete category
   if (pathname === "/api/admin/categories/delete" && method === "POST") {
     const body = await parseBody(req);
     let cats = readJSON("categories.json");
     cats = cats.filter(c => c.code !== body.code);
     writeJSON("categories.json", cats);
     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify({ success: true }));
     return;
   }
   }
   if (fs.existsSync(pp) && fs.statSync(pp).isFile()) {
     const extMap = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
     const ext = path.extname(pp);
     serveFile(res, fp, extMap[ext] || "text/plain");
     return;
   } 
   // Catch-all: serve index.html for SPA-style routes
   serveFile(res, "index.html");
 });
 
 server.listen(PORT, "0.0.0.0", () => {
   console.log(`🌐 바른투어 서버 시작됨: http://localhost:${PORT}`);
   console.log(`📋 관리자 로그인: http://localhost:${PORT}/admin.html`);
 });

