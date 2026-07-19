/*
 * tools/generate_thumbnails_parallel.js
 * Generates placeholder PNG thumbnails for each variant in generated/game_variants_200k.json
 * Uses sharp and runs with limited concurrency for speed and to avoid OOM.
 * Output thumbnails: backend/generated/thumbnails/{variantId}.png
 *
 * Usage:
 *   npm install sharp p-limit
 *   node tools/generate_thumbnails_parallel.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pLimit = require('p-limit');

const GENERATED_JSON = path.resolve(__dirname, '../generated/game_variants_200k.json');
if (!fs.existsSync(GENERATED_JSON)) {
  console.error('Missing generated/game_variants_200k.json. Run generate_200k_variants.js first');
  process.exit(1);
}

const outDir = path.resolve(__dirname, '../generated/thumbnails');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const data = JSON.parse(fs.readFileSync(GENERATED_JSON, 'utf8'));
const variants = data.variants;

console.log('Creating thumbnails for', variants.length, 'variants');

const concurrency = parseInt(process.env.THUMB_CONCURRENCY || '12', 10);
const limit = pLimit(concurrency);

const engineColors = {
  dice: '#1f8ef1',
  crash: '#e14eca',
  mines: '#f7b924',
  plinko: '#11cdef',
  color: '#2dce89',
  roulette: '#fb6340',
  slots: '#5e72e4'
};

async function createThumbnail(variant, idx) {
  const filename = path.join(outDir, `${variant.id}.png`);
  if (fs.existsSync(filename)) return filename;

  const bg = engineColors[variant.engine] || '#8898aa';
  const width = 640;
  const height = 360;

  const svg = `\n    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n      <rect width="100%" height="100%" fill="${bg}" />\n      <text x="50%" y="45%" font-size="28" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif">${variant.name}</text>\n      <text x="50%" y="65%" font-size="12" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif">${variant.id}</text>\n    </svg>\n  `;

  const buffer = Buffer.from(svg);
  try {
    await sharp(buffer).png({ compressionLevel: 9 }).toFile(filename);
    if (idx % 1000 === 0) console.log('Created', idx, filename);
    return filename;
  } catch (err) {
    console.error('sharp error for', variant.id, err.message);
    fs.writeFileSync(filename, buffer);
    return filename;
  }
}

(async () => {
  const tasks = variants.map((v, i) => limit(() => createThumbnail(v, i+1)));
  let i = 0;
  for await (const res of tasks) {
    i++;
    if (i % 1000 === 0) console.log('Progress:', i, '/', variants.length);
  }
  console.log('Done generating thumbnails in', outDir);
})();
