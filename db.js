const crypto = require("crypto");
const { Pool } = require("pg");

const product = {
  id: "xian-4d",
  title: "西安深度 · 兵马俑与盛唐夜色 3晚4日",
  subtitle: "从仁川直飞十三朝古都，在四天里遇见秦、汉、唐。",
  duration: "3晚4日", departure: "仁川机场", airline: "大韩航空直飞", destination: "中国 · 西安",
  description: "一条为首次探访西安的旅客设计的精华路线：兵马俑、华清宫、大雁塔、城墙骑行与大唐不夜城。全程安排中文审核版内容，正式韩语站上线前会统一翻译。",
  highlights: ["大韩航空仁川直飞", "国际五星级酒店连住3晚", "兵马俑与华清宫完整游览", "西安城墙骑行体验", "大唐不夜城夜游"],
  itinerary: [
    { day: 1, title: "仁川 → 西安", transport: "大韩航空直飞", meals: "晚餐", hotel: "西安国际五星级酒店", activities: ["仁川机场集合，搭乘航班前往西安", "专车接机并办理入住", "夜游大唐不夜城，感受盛唐灯火"] },
    { day: 2, title: "兵马俑与华清宫", transport: "专属旅游巴士", meals: "早 / 中 / 晚", hotel: "西安国际五星级酒店", activities: ["参观秦始皇兵马俑博物馆", "游览华清宫与骊山脚下的温泉遗址", "品尝陕西特色风味餐"] },
    { day: 3, title: "古城墙与大雁塔", transport: "专属旅游巴士 / 自行车", meals: "早 / 中 / 晚", hotel: "西安国际五星级酒店", activities: ["登西安明城墙，体验骑行", "参观大雁塔与大慈恩寺", "自由探索回民街美食"] },
    { day: 4, title: "西安 → 仁川", transport: "专车送机 / 大韩航空", meals: "早餐", hotel: "", activities: ["早餐后自由活动", "根据航班时间送往机场", "抵达仁川，行程结束"] }
  ],
  included: ["仁川—西安往返机票及税费", "全程3晚五星级酒店", "行程所列餐食与景点门票", "中文导游与专属旅游车辆", "出境旅游保险"],
  excluded: ["导游与司机服务费", "个人消费", "单人房差", "行程未注明的餐食与项目"],
  notes: ["护照有效期需在出发日后至少6个月", "最低成团人数与最终航班以确认通知为准", "本演示站不收集护照或真实支付资料"]
};

const imageSeed = [
  { position: 1, url: "/assets/xian-terracotta.webp", alt: "西安兵马俑", author: "Ondřej Žváček", sourceUrl: "https://commons.wikimedia.org/wiki/File:Terracotta_Army.jpg", license: "CC BY 2.5", licenseUrl: "https://creativecommons.org/licenses/by/2.5/" },
  { position: 2, url: "/assets/xian-huaqing.webp", alt: "西安华清宫", author: "源義信", sourceUrl: "https://commons.wikimedia.org/wiki/File:2023-10-08_Huaqing_Palace_華清宮.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  { position: 3, url: "/assets/xian-pagoda.webp", alt: "西安大雁塔", author: "NocturneNoir", sourceUrl: "https://commons.wikimedia.org/wiki/File:BigWildGoosePagoda1.JPG", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/" },
  { position: 4, url: "/assets/xian-city-wall.webp", alt: "西安城墙", author: "H2v5o68z", sourceUrl: "https://commons.wikimedia.org/wiki/File:City_wall_of_Xi%27an.jpg", license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" }
];

let pool;
let usesRailwayDemoFallback = false;

function createMemoryPool() {
  const { newDb } = require("pg-mem");
  const memoryDb = newDb({ autoCreateForeignKeyIndices: true });
  return new (memoryDb.adapters.createPg().Pool)();
}

function getPool() {
  if (pool) return pool;
  if (process.env.LOCAL_DEMO === "1") {
    pool = createMemoryPool();
    return pool;
  }
  if (!process.env.DATABASE_URL && process.env.RAILWAY_PROJECT_ID) {
    usesRailwayDemoFallback = true;
    console.warn("[demo] DATABASE_URL is missing; using an ephemeral in-memory database until Railway PostgreSQL is connected.");
    pool = createMemoryPool();
    return pool;
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required. Set LOCAL_DEMO=1 only for local test mode.");
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
  return pool;
}

function passwordHash(password, salt = crypto.randomBytes(16).toString("hex")) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(`${salt}:${key.toString("hex")}`)));
}
function passwordMatches(password, stored) {
  const [salt, saved] = stored.split(":");
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(crypto.timingSafeEqual(Buffer.from(saved, "hex"), key))));
}

async function initializeDatabase() {
  const database = getPool();
  await database.query(`
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT NOT NULL, duration TEXT NOT NULL, departure TEXT NOT NULL, airline TEXT NOT NULL, destination TEXT NOT NULL, description TEXT NOT NULL, highlights JSONB NOT NULL, itinerary JSONB NOT NULL, included JSONB NOT NULL, excluded JSONB NOT NULL, notes JSONB NOT NULL);
    CREATE TABLE IF NOT EXISTS product_images (id SERIAL PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, position INTEGER NOT NULL, url TEXT NOT NULL, alt TEXT NOT NULL, author TEXT NOT NULL, source_url TEXT NOT NULL, license TEXT NOT NULL, license_url TEXT NOT NULL, UNIQUE(product_id, position));
    CREATE TABLE IF NOT EXISTS departures (id SERIAL PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, travel_date DATE NOT NULL, adult_price INTEGER NOT NULL CHECK(adult_price >= 0), child_price INTEGER NOT NULL CHECK(child_price >= 0), infant_price INTEGER NOT NULL CHECK(infant_price >= 0), capacity INTEGER NOT NULL CHECK(capacity > 0), reserved_seats INTEGER NOT NULL DEFAULT 0 CHECK(reserved_seats >= 0), is_on_sale BOOLEAN NOT NULL DEFAULT TRUE, note TEXT NOT NULL DEFAULT '', UNIQUE(product_id, travel_date));
    CREATE TABLE IF NOT EXISTS admin_users (id SERIAL PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, order_no TEXT NOT NULL UNIQUE, product_id TEXT NOT NULL REFERENCES products(id), departure_id INTEGER NOT NULL REFERENCES departures(id), adults INTEGER NOT NULL CHECK(adults >= 1), children INTEGER NOT NULL DEFAULT 0 CHECK(children >= 0), infants INTEGER NOT NULL DEFAULT 0 CHECK(infants >= 0), total_price INTEGER NOT NULL CHECK(total_price >= 0), contact_name TEXT NOT NULL, contact_phone TEXT NOT NULL, contact_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT', payment_mode TEXT NOT NULL DEFAULT 'DEMO', is_test BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), paid_at TIMESTAMPTZ);
  `);
  await database.query(`INSERT INTO products (id,title,subtitle,duration,departure,airline,destination,description,highlights,itinerary,included,excluded,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (id) DO NOTHING`, [product.id, product.title, product.subtitle, product.duration, product.departure, product.airline, product.destination, product.description, JSON.stringify(product.highlights), JSON.stringify(product.itinerary), JSON.stringify(product.included), JSON.stringify(product.excluded), JSON.stringify(product.notes)]);
  for (const image of imageSeed) await database.query(`INSERT INTO product_images (product_id,position,url,alt,author,source_url,license,license_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (product_id,position) DO NOTHING`, [product.id, image.position, image.url, image.alt, image.author, image.sourceUrl, image.license, image.licenseUrl]);
  if (usesRailwayDemoFallback) {
    await database.query(`
      INSERT INTO departures (product_id,travel_date,adult_price,child_price,infant_price,capacity,note)
      VALUES
        ($1,'2026-10-15',949000,849000,150000,20,'公网演示团期'),
        ($1,'2026-11-12',979000,879000,150000,20,'公网演示团期')
      ON CONFLICT (product_id,travel_date) DO NOTHING
    `, [product.id]);
  }
  const username = process.env.ADMIN_INITIAL_USERNAME || "admin";
  if (process.env.ADMIN_INITIAL_PASSWORD) {
    const found = await database.query("SELECT id FROM admin_users WHERE username=$1", [username]);
    if (!found.rowCount) await database.query("INSERT INTO admin_users (username,password_hash) VALUES ($1,$2)", [username, await passwordHash(process.env.ADMIN_INITIAL_PASSWORD)]);
  }
}

module.exports = { getPool, initializeDatabase, passwordMatches };
