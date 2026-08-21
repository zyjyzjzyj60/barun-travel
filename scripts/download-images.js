/* Download only the pre-vetted Wikimedia Commons images listed below.
   Keep the matching author, source and license in db.js / attribution.html. */
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const assets = [
  ["Terracotta_Army.jpg", "xian-terracotta.webp"],
  ["2023-10-08_Huaqing_Palace_華清宮.jpg", "xian-huaqing.webp"],
  ["BigWildGoosePagoda1.JPG", "xian-pagoda.webp"],
  ["City_wall_of_Xi'an.jpg", "xian-city-wall.webp"]
];
const destination = path.join(__dirname, "..", "public", "assets");

async function download(filename, target) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=2200`;
  const response = await fetch(url, { headers: { "User-Agent": "BarunTravelDemo/1.0 (licensed imagery optimization)" }, redirect: "follow" });
  if (!response.ok) throw new Error(`${filename}: HTTP ${response.status}`);
  const input = Buffer.from(await response.arrayBuffer());
  await sharp(input).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(path.join(destination, target));
  console.log(`saved ${target}`);
}

async function main() {
  await fs.mkdir(destination, { recursive: true });
  await Promise.all(assets.map(([filename, target]) => download(filename, target)));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
