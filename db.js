const crypto = require("crypto");
const { Pool } = require("pg");
const { catalog } = require("./catalog");

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
    usesRailwayDemoFallback = true;
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

async function enableRailwayDemoFallback() {
  if (!process.env.RAILWAY_PROJECT_ID) throw new Error("Railway demo fallback is only available on Railway.");
  if (pool?.end) await pool.end().catch(() => {});
  usesRailwayDemoFallback = true;
  pool = createMemoryPool();
}

function passwordHash(password, salt = crypto.randomBytes(16).toString("hex")) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(`${salt}:${key.toString("hex")}`)));
}

function passwordMatches(password, stored) {
  const [salt, saved] = stored.split(":");
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(crypto.timingSafeEqual(Buffer.from(saved, "hex"), key))));
}

function storedProduct(product) {
  return {
    id: product.id,
    title: product.title.ko,
    subtitle: product.subtitle.ko,
    duration: product.duration.ko,
    departure: product.departure.ko,
    airline: product.airline.ko,
    destination: product.destination.ko,
    description: product.description.ko,
    highlights: product.highlights,
    itinerary: product.itinerary,
    included: product.included,
    excluded: product.excluded,
    notes: product.notes,
    content: {
      titleZh: product.title.zh,
      subtitleZh: product.subtitle.zh,
      durationZh: product.duration.zh,
      departureZh: product.departure.zh,
      airlineZh: product.airline.zh,
      destinationZh: product.destination.zh,
      descriptionZh: product.description.zh,
      tag: product.tag,
      theme: product.theme,
      heroImage: product.heroImage,
      map: product.map
    }
  };
}

async function seedCatalog(database) {
  for (const fixture of catalog) {
    const product = storedProduct(fixture);
    await database.query(`INSERT INTO products (id,title,subtitle,duration,departure,airline,destination,description,highlights,itinerary,included,excluded,notes,content)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (id) DO UPDATE SET
        title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, duration=EXCLUDED.duration, departure=EXCLUDED.departure,
        airline=EXCLUDED.airline, destination=EXCLUDED.destination, description=EXCLUDED.description,
        highlights=EXCLUDED.highlights, itinerary=EXCLUDED.itinerary, included=EXCLUDED.included,
        excluded=EXCLUDED.excluded, notes=EXCLUDED.notes, content=EXCLUDED.content`, [
      product.id, product.title, product.subtitle, product.duration, product.departure, product.airline,
      product.destination, product.description, JSON.stringify(product.highlights), JSON.stringify(product.itinerary),
      JSON.stringify(product.included), JSON.stringify(product.excluded), JSON.stringify(product.notes), JSON.stringify(product.content)
    ]);
    for (const image of fixture.images) {
      await database.query(`INSERT INTO product_images (product_id,position,url,alt,author,source_url,license,license_url)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (product_id,position) DO UPDATE SET
          url=EXCLUDED.url, alt=EXCLUDED.alt, author=EXCLUDED.author, source_url=EXCLUDED.source_url,
          license=EXCLUDED.license, license_url=EXCLUDED.license_url`, [
        fixture.id, image.position, image.url, image.alt.ko, image.author, image.sourceUrl, image.license, image.licenseUrl
      ]);
    }
  }
}

async function seedDemoDepartures(database) {
  if (!usesRailwayDemoFallback) return;
  await database.query(`INSERT INTO departures (product_id,travel_date,adult_price,child_price,infant_price,capacity,note)
    VALUES
      ('xian-4d','2026-10-15',949000,849000,150000,20,'공개 시연 출발일 · 公网演示团期'),
      ('xian-4d','2026-11-12',979000,879000,150000,20,'공개 시연 출발일 · 公网演示团期'),
      ('silkroad-11d','2026-10-28',1790000,1640000,250000,16,'공개 시연 출발일 · 公网演示团期'),
      ('silkroad-11d','2026-11-25',1850000,1690000,250000,16,'공개 시연 출발일 · 公网演示团期')
    ON CONFLICT (product_id,travel_date) DO NOTHING`);
}

async function initializeDatabase() {
  const database = getPool();
  await database.query(`
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT NOT NULL, duration TEXT NOT NULL, departure TEXT NOT NULL, airline TEXT NOT NULL, destination TEXT NOT NULL, description TEXT NOT NULL, highlights JSONB NOT NULL, itinerary JSONB NOT NULL, included JSONB NOT NULL, excluded JSONB NOT NULL, notes JSONB NOT NULL);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS content JSONB NOT NULL DEFAULT '{}';
    CREATE TABLE IF NOT EXISTS product_images (id SERIAL PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, position INTEGER NOT NULL, url TEXT NOT NULL, alt TEXT NOT NULL, author TEXT NOT NULL, source_url TEXT NOT NULL, license TEXT NOT NULL, license_url TEXT NOT NULL, UNIQUE(product_id, position));
    CREATE TABLE IF NOT EXISTS departures (id SERIAL PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, travel_date DATE NOT NULL, adult_price INTEGER NOT NULL CHECK(adult_price >= 0), child_price INTEGER NOT NULL CHECK(child_price >= 0), infant_price INTEGER NOT NULL CHECK(infant_price >= 0), capacity INTEGER NOT NULL CHECK(capacity > 0), reserved_seats INTEGER NOT NULL DEFAULT 0 CHECK(reserved_seats >= 0), is_on_sale BOOLEAN NOT NULL DEFAULT TRUE, note TEXT NOT NULL DEFAULT '', UNIQUE(product_id, travel_date));
    CREATE TABLE IF NOT EXISTS admin_users (id SERIAL PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, order_no TEXT NOT NULL UNIQUE, product_id TEXT NOT NULL REFERENCES products(id), departure_id INTEGER NOT NULL REFERENCES departures(id), adults INTEGER NOT NULL CHECK(adults >= 1), children INTEGER NOT NULL DEFAULT 0 CHECK(children >= 0), infants INTEGER NOT NULL DEFAULT 0 CHECK(infants >= 0), total_price INTEGER NOT NULL CHECK(total_price >= 0), contact_name TEXT NOT NULL, contact_phone TEXT NOT NULL, contact_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT', payment_mode TEXT NOT NULL DEFAULT 'DEMO', is_test BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), paid_at TIMESTAMPTZ);
  `);
  await seedCatalog(database);
  await seedDemoDepartures(database);
  const username = process.env.ADMIN_INITIAL_USERNAME || "admin";
  if (process.env.ADMIN_INITIAL_PASSWORD) {
    const found = await database.query("SELECT id FROM admin_users WHERE username=$1", [username]);
    if (!found.rowCount) await database.query("INSERT INTO admin_users (username,password_hash) VALUES ($1,$2)", [username, await passwordHash(process.env.ADMIN_INITIAL_PASSWORD)]);
  }
}

module.exports = { catalog, getPool, initializeDatabase, passwordMatches, enableRailwayDemoFallback };
