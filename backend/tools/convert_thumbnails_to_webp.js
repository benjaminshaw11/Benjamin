/*
 * tools/convert_thumbnails_to_webp.js
 * Convert generated PNG thumbnails to WebP to save space before upload.
 * Usage:
 *   npm install sharp p-limit
 *   node tools/convert_thumbnails_to_webp.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pLimit = require('p-limit');

const thumbsDir = path.resolve(__dirname, '../generated/thumbnails');
const outDir = path.resolve(__dirname, '../generated/thumbnails_webp');
if (!fs.existsSync(thumbsDir)) {
  console.error('Thumbnails dir not found:', thumbsDir);
  process.exit(1);
}
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const concurrency = parseInt(process.env.WEBP_CONCURRENCY || '12', 10);
const limit = pLimit(concurrency);

const files = fs.readdirSync(thumbsDir).filter(f => f.endsWith('.png'));
console.log('Converting', files.length, 'PNGs to WebP with concurrency', concurrency);
let i = 0;

async function toWebp(file) {
  const inPath = path.join(thumbsDir, file);
  const outPath = path.join(outDir, file.replace(/\.png$/i, '.webp'));
  if (fs.existsSync(outPath)) return outPath;
  try {
    await sharp(inPath).webp({ quality: 80 }).toFile(outPath);
    i++;
    if (i % 1000 === 0) console.log('Converted', i);
    return outPath;
  } catch (err) {
    console.error('Failed convert', inPath, err.message);
    return null;
  }
}

(async () => {
  const tasks = files.map(f => limit(() => toWebp(f)));
  await Promise.all(tasks);
  console.log('WebP conversion complete. Output dir:', outDir);
})();
