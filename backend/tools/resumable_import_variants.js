/*
 * tools/resumable_import_variants.js
 * Improved import script that supports resume and progress state file.
 * Usage:
 *   node tools/resumable_import_variants.js path/to/game_variants.json
 * Progress file: backend/generated/import_progress_700k.json
 */
const fs = require('fs');
const path = require('path');

const jsonPath = process.argv[2] || path.resolve(__dirname, '../generated/game_variants_700k.json');
if (!fs.existsSync(jsonPath)) {
  console.error('JSON not found:', jsonPath);
  process.exit(1);
}

const progressPath = path.resolve(__dirname, '../generated/import_progress_700k.json');

const { sequelize, GameCatalog } = require('../src/models');

(async () => {
  try {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const variants = raw.variants || raw;
    console.log('Importing', variants.length, 'variants (resumable)');

    const batchSize = 500;
    let startIndex = 0;
    if (fs.existsSync(progressPath)) {
      try {
        const prog = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
        if (prog && typeof prog.lastIndex === 'number') {
          startIndex = prog.lastIndex + 1;
          console.log('Resuming from index', startIndex);
        }
      } catch (err) {
        console.warn('Could not read progress file, starting from 0');
      }
    }

    for (let i = startIndex; i < variants.length; i += batchSize) {
      const batch = variants.slice(i, i + batchSize);
      const t = await sequelize.transaction();
      try {
        const ops = batch.map(v => {
          const payload = {
            provider: 'inhouse',
            provider_game_id: v.id,
            title: v.name,
            engine: v.engine,
            params: v.params || {},
            skin: v.skin || null,
            bet_tier: v.betTier || null,
            house_edge: v.houseEdge || null,
            thumbnail_url: v.thumbnailUrl || null,
            metadata: { generatedBy: 'generator_700k' }
          };
          return GameCatalog.upsert(payload, { transaction: t });
        });
        await Promise.all(ops);
        await t.commit();

        // write progress
        fs.writeFileSync(progressPath, JSON.stringify({ lastIndex: i + batch.length - 1, updatedAt: new Date().toISOString() }, null, 2));
        console.log('Imported batch', i, '-', i + batch.length - 1);
      } catch (err) {
        await t.rollback();
        console.error('Batch import error at', i, err.message);
        process.exit(1);
      }
    }

    console.log('Import completed successfully');
    // remove progress file on success
    try { fs.unlinkSync(progressPath); } catch (e) {}
    process.exit(0);
  } catch (err) {
    console.error('Import error', err);
    process.exit(1);
  }
})();
