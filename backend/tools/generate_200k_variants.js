const fs = require('fs');
const path = require('path');

/**
 * tools/generate_200k_variants.js
 * Generates ~200k+ game variant metadata JSON for the platform.
 * Output: backend/generated/game_variants_200k.json
 *
 * Usage:
 *   node tools/generate_200k_variants.js
 *
 * Tune `config` below to change counts. The script aims to produce >=200k variants.
 */

const outDir = path.resolve(__dirname, '../generated');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const config = {
  skins: 40,           // number of skins/themes
  betTiers: 5,         // distinct bet tiers
  houseEdgeVariants: 3,// small house-edge variations

  // engine-specific presets tuned to reach 200k+
  dice: { multipliers: 8 },
  crash: { presets: 20 },
  mines: { mineCounts: [1,2,3,4,5,6,7] },
  plinko: { rows: [6,7,8,9,10] },
  color: { palettes: 6 },
  roulette: { wheelTypes: ['eu','us'], layouts: 4 },
  // Slots are the main multiplier — increase paytablePresets to reach 200k
  slots: {
    reelsOptions: [3,5],       // 2
    symbolsOptions: [8,10,12], // 3
    paytablePresets: 200       // 200 -> large generator
  }
};

function uid(parts) {
  return parts.join('-').replace(/\s+/g, '_').toLowerCase();
}

const variants = [];

function forEachCombo(arrays, cb, prefix = []) {
  if (arrays.length === 0) {
    cb(prefix);
    return;
  }
  const [head, ...tail] = arrays;
  for (const v of head) {
    forEachCombo(tail, cb, prefix.concat([v]));
  }
}

const skins = Array.from({length: config.skins}, (_,i)=>`skin${i+1}`);
const betTiers = Array.from({length: config.betTiers}, (_,i)=>({ id:`tier${i+1}`, min: (i===0?1: (i*10)), max: (i+1)*10000 }));
const houseEdges = Array.from({length: config.houseEdgeVariants}, (_,i)=> (0.02 + i*0.01).toFixed(3) );

// Helper to push a variant
function pushVariant(obj) { variants.push(obj); }

// DICE
forEachCombo([skins, betTiers, houseEdges, Array.from({length: config.dice.multipliers}, (_,i)=> (1.5 + i*0.25).toFixed(2))],
  ([skin, tier, he, multiplier]) => {
    pushVariant({
      id: uid(['dice', skin, tier.id, `he${he}`, `m${multiplier}`]),
      engine: 'dice',
      name: `Dice — ${skin} — ${tier.id} — x${multiplier}`,
      skin, betTier: tier, houseEdge: parseFloat(he), params: { targetMultiplier: parseFloat(multiplier) }
    });
  });

// CRASH
forEachCombo([skins, betTiers, houseEdges, Array.from({length: config.crash.presets}, (_,i)=>`preset${i+1}`)],
  ([skin, tier, he, preset]) => {
    pushVariant({
      id: uid(['crash', skin, tier.id, `he${he}`, preset]),
      engine: 'crash',
      name: `Crash — ${skin} — ${tier.id} — ${preset}`,
      skin, betTier: tier, houseEdge: parseFloat(he), params: { crashPreset: preset }
    });
  });

// MINES
forEachCombo([skins, betTiers, houseEdges, config.mines.mineCounts],
  ([skin, tier, he, mineCount]) => {
    pushVariant({
      id: uid(['mines', skin, tier.id, `he${he}`, `m${mineCount}`]),
      engine: 'mines',
      name: `Mines (${mineCount}) — ${skin} — ${tier.id}`,
      skin, betTier: tier, houseEdge: parseFloat(he), params: { mineCount }
    });
  });

// PLINKO
forEachCombo([skins, betTiers, houseEdges, config.plinko.rows],
  ([skin, tier, he, rows]) => {
    pushVariant({
      id: uid(['plinko', skin, tier.id, `he${he}`, `r${rows}`]),
      engine: 'plinko',
      name: `Plinko ${rows} rows — ${skin} — ${tier.id}`,
      skin, betTier: tier, houseEdge: parseFloat(he), params: { rows }
    });
  });

// COLOR PREDICTION
forEachCombo([skins, betTiers, houseEdges, Array.from({length: config.color.palettes}, (_,i)=>`palette${i+1}`)],
  ([skin, tier, he, palette]) => {
    pushVariant({
      id: uid(['color', skin, tier.id, `he${he}`, palette]),
      engine: 'color',
      name: `Color — ${palette} — ${skin}`,
      skin, betTier: tier, houseEdge: parseFloat(he), params: { palette }
    });
  });

// ROULETTE
forEachCombo([skins, betTiers, houseEdges, config.roulette.wheelTypes, Array.from({length: config.roulette.layouts}, (_,i)=>`layout${i+1}`)],
  ([skin, tier, he, wheel, layout]) => {
    pushVariant({
      id: uid(['roulette', wheel, skin, tier.id, `he${he}`, layout]),
      engine: 'roulette',
      name: `Roulette (${wheel}) ${layout} — ${skin}`,
      skin, betTier: tier, houseEdge: parseFloat(he), params: { wheel, layout }
    });
  });

// SLOTS (parameterized) - main multiplier to hit target count
forEachCombo([skins, betTiers, houseEdges, config.slots.reelsOptions, config.slots.symbolsOptions, Array.from({length: config.slots.paytablePresets}, (_,i)=>`pay${i+1}`)],
  ([skin, tier, he, reels, symbols, pay]) => {
    pushVariant({
      id: uid(['slots', `r${reels}`, `s${symbols}`, pay, skin, tier.id]),
      engine: 'slots',
      name: `Slots ${reels}r/${symbols}s ${pay} — ${skin} — ${tier.id}`,
      skin, betTier: tier, houseEdge: parseFloat(he), params: { reels, symbols, paytablePreset: pay }
    });
  });

const out = {
  generatedAt: new Date().toISOString(),
  config,
  totalVariants: variants.length,
  variants
};

const outPath = path.join(outDir, 'game_variants_200k.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Generated', variants.length, 'variants ->', outPath);
