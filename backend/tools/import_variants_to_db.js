/*
 * tools/import_variants_to_db.js
 * Reads generated/game_variants_200k.json or game_variants_with_thumbnails.json and imports into GameCatalog model in batches.
 * Usage:
 *   node tools/import_variants_to_db.js [path_to_json]
 *
 * Make sure backend/.env is configured and database is reachable. This script uses your existing Sequelize models.
 */

const fs = require('fs');
const path = require('path');

const jsonPath = process.argv[2] || path.resolve(__dirname, '../generated/game_variants_with_thumbnails.json');
if (!fs.existsSync(jsonPath)) {
  console.error('JSON not found:', jsonPath);
  process.exit(1);
}

const { sequelize, GameCatalog } = require('../src/models');

(async () => {
  try {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const variants = raw.variants || raw;
    console.log('Importing', variants.length, 'variants');

    const batchSize = 500;
    for (let i = 0; i < variants.length; i += batchSize) {
      const batch = variants.slice(i, i + batchSize);
      const t = await sequelize.transaction();
      try {
        for (const v of batch) {
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
            metadata: { generatedBy: 'generator_200k' }
          };
          // Upsert (Postgres supports upsert via upsert method)
          await GameCatalog.upsert(payload, { transaction: t });
        }
        await t.commit();
        console.log('Imported batch', i, '-', i + batch.length - 1);
      } catch (err) {
        await t.rollback();
        console.error('Batch import error at', i, err.message);
        throw err;
      }
    }

    console.log('Import completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Import error', err);
    process.exit(1);
  }
})();
