const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

async function saveEvidence(depositId, filename, dataBase64) {
  const ext = path.extname(filename) || '.bin';
  const safe = `${depositId}-${Date.now()}${ext}`;
  const full = path.join(UPLOADS_DIR, safe);
  const buffer = Buffer.from(dataBase64, 'base64');
  await fs.promises.writeFile(full, buffer);
  // return relative path
  return { path: `/uploads/${safe}`, fullPath: full };
}

module.exports = { saveEvidence };
