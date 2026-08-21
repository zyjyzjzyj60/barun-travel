/* Download only the pre-vetted Wikimedia Commons images listed below.
   Keep the matching author, source and license in db.js / attribution.html. */
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const assets = [
  ["Terracotta Army", "https://live.staticflickr.com/505/19380290525_2be8884c05_b.jpg", "xian-terracotta.webp"],
  ["Huaqing Palace", "https://live.staticflickr.com/4224/35109621691_14ea090514_b.jpg", "xian-huaqing.webp"],
  ["Big Wild Goose Pagoda", "https://live.staticflickr.com/3326/3515721587_f7fa43afea_b.jpg", "xian-pagoda.webp"],
  ["Xi'an City Wall", "https://live.staticflickr.com/3722/9912110523_554a7db58b_b.jpg", "xian-city-wall.webp"]
];
const destination = path.join(__dirname, "..", "public", "assets");

async function fetchImage(label, downloadUrl) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(downloadUrl, {
        headers: { "User-Agent": "BarunTravelDemo/1.0 (licensed imagery optimization)" },
        redirect: "follow",
        signal: AbortSignal.timeout(45000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      console.warn(`${label}: download attempt ${attempt} failed (${error.message})`);
    }
  }
  throw new Error(`${label}: ${lastError.message}`);
}

async function download(label, downloadUrl, target) {
  const input = await fetchImage(label, downloadUrl);
  await sharp(input).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(path.join(destination, target));
  console.log(`saved ${target}`);
}

async function main() {
  await fs.mkdir(destination, { recursive: true });
  for (const [label, downloadUrl, target] of assets) {
    await download(label, downloadUrl, target);
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
