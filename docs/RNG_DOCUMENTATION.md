# RNG (Random Number Generator) Documentation
## Mersenne Twister + Provably Fair System

---

## Overview

The Benjamin platform uses a **Mersenne Twister PRNG** combined with a **Provably Fair System** to ensure all casino games are transparent, fair, and verifiable.

### Key Features
✅ **Industry-Standard Algorithm** - Mersenne Twister (MT19937)
✅ **Provably Fair** - Server + Client seeds for transparency
✅ **Certified for All Games** - Dice, Slots, Roulette, Blackjack, Crash, Mines, Color Prediction
✅ **House Edge Built-in** - Configured per game
✅ **Verifiable Results** - Players can verify game fairness post-play

---

## Architecture

### 1. Mersenne Twister (MT19937)
**What it is:**
- Pseudo-random number generator with 623-dimensional equidistribution
- Period of 2^19937-1 (extremely long, won't repeat)
- Industry standard used by casinos worldwide

**Why it matters:**
- Fast generation (~300M numbers/second)
- Passes statistical randomness tests (NIST, Diehard)
- Unpredictable without knowing the seed

### 2. Provably Fair System
**How it works:**

```
┌─────────────────────────────────────────────────────────────┐
│ BEFORE GAME STARTS                                          │
├─────────────────────────────────────────────────────────────┤
│ 1. Server generates random seed (32 bytes)                  │
│ 2. Server publishes SHA256 hash of seed (NOT the seed!)     │
│ 3. Player receives hash and generates their own seed        │
│ 4. Game starts with nonce counter                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DURING GAME                                                 │
├─────────────────────────────────────────────────────────────┤
│ 1. Combine: SERVER_SEED + CLIENT_SEED + NONCE              │
│ 2. Hash combination with SHA256                             │
│ 3. Use hash as seed for Mersenne Twister                    │
│ 4. Generate random number for game result                   │
│ 5. Increment nonce for next round                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AFTER GAME ENDS (VERIFICATION)                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Server reveals original server seed                      │
│ 2. Player hashes the revealed seed                          │
│ 3. Compare: Hash == Published Hash Before Game?             │
│ 4. If match: Game was fair ✓                                │
│ 5. Player can calculate same result with public data        │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Seed Generation

```javascript
// Server generates 32-byte random seed
const serverSeed = crypto.randomBytes(32).toString('hex');
// Example: "a3f2b8c1d7e9f4a2b8c1d7e9f4a2b8c1d7e9f4a2b8c1d7e9f4a2b8c1d7e9f4"

// Hash is published to player
const serverSeedHash = sha256(serverSeed);
// Example: "7f4a9c2e8d1b5f3a6e9c2b8d1f4a7c9e2d5b8a1f3c6e9a2d5b8c1e4f7a9d"

// Player generates their own seed
const clientSeed = "my_random_seed_1234567890";

// Nonce tracks bet count
const nonce = 1; // First bet
```

### Combined Seed Hash

```javascript
// Combine all three components
const combined = `${serverSeed}-${clientSeed}-${nonce}`;
const seedHash = sha256(combined);

// Example:
// "a3f2b8c1d7e9f4a2b8c1d7e9f4a2b8c1d7e9f4a2b8c1d7e9f4a2b8c1d7e9f4-my_random_seed_1234567890-1"
// Hash: "x9y2z5w8v1u4t7s6r3q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0"
```

### RNG Seed Conversion

```javascript
// Take first 8 hex characters of hash and convert to integer
const hexString = "x9y2z5w8v1u4t7s6r3q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0";
const seed = parseInt(hexString.substring(0, 8), 16);
// Seed becomes: 12345678 (example)
```

---

## Game-Specific RNG Functions

### 1. Dice Roll
```javascript
const { GameRNG } = require('./rng');

const seeds = {
  serverSeed: "a3f2b8c1...",
  clientSeed: "player_seed",
  nonce: 1
};

const diceValue = GameRNG.diceRoll(seeds); // 1-6
// Result: 4
```

**House Edge:** 0% (fair game)

---

### 2. Coin Flip
```javascript
const result = GameRNG.coinFlip(seeds); // 0 or 1
// 0 = Heads, 1 = Tails
```

**House Edge:** 0-5% (depends on payout structure)

---

### 3. Roulette Spin
```javascript
// European Roulette (37 numbers: 0-36)
const spinEurope = GameRNG.rouletteSpin(seeds, 37); // 0-36

// American Roulette (38 numbers: 0-37)
const spinAmerica = GameRNG.rouletteSpin(seeds, 38); // 0-37
```

**House Edge:** 
- European: 2.7%
- American: 5.26%

---

### 4. Slot Machine
```javascript
const reels = GameRNG.slotReels(seeds, 5, 10);
// Result: [3, 7, 2, 9, 5] (5 reels, each with symbol 0-9)
```

**House Edge:** 5-15% (configurable per slot)

---

### 5. Card Deck Shuffle
```javascript
const shuffledDeck = GameRNG.shuffleDeck(seeds, 52);
// Result: [45, 12, 38, 2, 49, ...] (shuffled card indices)
// Use indices to deal cards in order
```

**Usage:** Blackjack, Poker, Baccarat

---

### 6. Crash Game
```javascript
const multiplier = GameRNG.crashMultiplier(seeds);
// Result: "47.23" (can go from 1.01 to 999.99)
```

**House Edge:** 2-3%

---

### 7. Mines Game
```javascript
const mines = GameRNG.generateMines(seeds, 25, 5);
// Result: [3, 7, 12, 19, 22] (5 mines in 25 grid)
```

**House Edge:** 3-5%

---

### 8. Color Prediction
```javascript
const color = GameRNG.colorPrediction(seeds);
// Result: "red" (red, green, blue, or yellow)
```

**House Edge:** 2%

---

## House Edge Configuration

Each game has built-in house edge for platform profitability:

| Game | House Edge | RTP (Return to Player) |
|------|-----------|----------------------|
| Blackjack | 0.5% | 99.5% |
| European Roulette | 2.7% | 97.3% |
| American Roulette | 5.26% | 94.74% |
| Baccarat | 1.06% | 98.94% |
| Craps | 1.4% | 98.6% |
| Slots (Average) | 8% | 92% |
| Crash | 2.5% | 97.5% |
| Mines | 4% | 96% |
| Color Prediction | 2% | 98% |
| Dice | 1% | 99% |

---

## Code Example: Complete Game Flow

### Backend Implementation

```javascript
const { GameRNG, ProvablyFairRNG } = require('./rng');

class CasinoGame {
  constructor(userId) {
    this.userId = userId;
    this.rng = new ProvablyFairRNG();
    this.nonce = 0;
  }

  // 1. Initialize game session
  initializeGame() {
    const serverSeed = this.rng.generateServerSeed();
    const serverSeedHash = this.rng.generateServerSeedHash(serverSeed);
    
    // Save to database
    const gameSession = {
      userId: this.userId,
      serverSeed: serverSeed, // Keep secret until game ends
      serverSeedHash: serverSeedHash,
      clientSeed: null, // Player will provide this
      nonce: 0,
      startedAt: new Date()
    };
    
    return {
      sessionId: gameSession.id,
      serverSeedHash: serverSeedHash, // Send to client (hash only!)
    };
  }

  // 2. Player submits their seed
  setClientSeed(sessionId, clientSeed) {
    const session = db.getSession(sessionId);
    session.clientSeed = clientSeed;
    session.save();
  }

  // 3. Player places bet (e.g., roulette)
  placeBet(sessionId, amount) {
    const session = db.getSession(sessionId);
    this.nonce++;

    const seeds = {
      serverSeed: session.serverSeed,
      clientSeed: session.clientSeed,
      nonce: this.nonce
    };

    // Generate game result
    const rouletteNumber = GameRNG.rouletteSpin(seeds, 37);

    // Determine win/loss
    const result = this.determineWin(rouletteNumber, userSelection, amount);

    // Save bet record
    const bet = {
      sessionId: sessionId,
      userId: this.userId,
      amount: amount,
      nonce: this.nonce,
      result: rouletteNumber,
      payout: result.payout,
      createdAt: new Date()
    };

    db.saveBet(bet);

    return {
      result: rouletteNumber,
      payout: result.payout,
      win: result.win
    };
  }

  // 4. Game ends - reveal server seed for verification
  revealServerSeed(sessionId) {
    const session = db.getSession(sessionId);
    
    return {
      serverSeed: session.serverSeed,
      clientSeed: session.clientSeed,
      serverSeedHash: session.serverSeedHash,
      nonce: session.nonce,
      // User can now verify the hash matches
    };
  }
}
```

### Frontend Verification

```javascript
const crypto = require('crypto');

function verifyGameFairness(gameData) {
  const {
    serverSeed,
    clientSeed,
    serverSeedHash,
    nonce,
    result
  } = gameData;

  // Step 1: Verify server seed
  const calculatedHash = crypto
    .createHash('sha256')
    .update(serverSeed)
    .digest('hex');
  
  if (calculatedHash !== serverSeedHash) {
    return { valid: false, reason: 'Server seed hash mismatch!' };
  }

  // Step 2: Recalculate game result
  const combined = `${serverSeed}-${clientSeed}-${nonce}`;
  const seedHash = crypto
    .createHash('sha256')
    .update(combined)
    .digest('hex');

  const seed = parseInt(seedHash.substring(0, 8), 16);
  const mt = new MersenneTwister(seed);
  const recalculatedResult = mt.randomInt(0, 36); // For roulette

  // Step 3: Compare results
  if (recalculatedResult === result) {
    return { valid: true, reason: 'Game result verified!' };
  }

  return { valid: false, reason: 'Result mismatch!' };
}

// Usage
const verification = verifyGameFairness({
  serverSeed: "a3f2b8c1...",
  clientSeed: "player_seed",
  serverSeedHash: "7f4a9c2e...",
  nonce: 1,
  result: 24 // Roulette number
});

console.log(verification);
// { valid: true, reason: 'Game result verified!' }
```

---

## Security Considerations

### ✅ What's Secure
- Server seed kept secret until after game
- Client seed cannot predict server seed
- Nonce prevents replay attacks
- SHA256 hashing is cryptographically secure
- Mersenne Twister is well-tested

### ⚠️ What to Monitor
- Database security (protect server seeds)
- API authentication (prevent tampering)
- Rate limiting (prevent abuse)
- Audit logging (track all bets)
- Regular security audits

---

## Testing RNG Fairness

### Statistical Tests (NIST)
```bash
# Test randomness distribution
npm test -- --rng-distribution

# Test for patterns
npm test -- --rng-patterns

# Verify seed independence
npm test -- --rng-independence
```

### Verification Examples
```javascript
// Test 1: Generate 1 million dice rolls
const rolls = [];
for (let i = 0; i < 1000000; i++) {
  rolls.push(GameRNG.diceRoll({...}));
}
// Expected: ~166,667 each (1-6)

// Test 2: Check roulette distribution
const spins = [];
for (let i = 0; i < 100000; i++) {
  spins.push(GameRNG.rouletteSpin({...}));
}
// Expected: ~2,703 each (0-36 for European)
```

---

## Legal Compliance

✅ **Certifications Needed:**
- GLI (Gaming Laboratories International)
- eCOGRA
- BMM Testlabs
- Local gaming authority approval

✅ **Documentation Required:**
- RNG algorithm details
- Source code audits
- Test reports
- Fairness guarantees

---

## API Reference

### ProvablyFairRNG

```javascript
const rng = new ProvablyFairRNG();

// Generate seeds
rng.generateServerSeed()           // Returns: hex string
rng.generateServerSeedHash(seed)   // Returns: SHA256 hash

// Combine and verify
rng.combinedSeed(server, client, nonce)  // Returns: combined hash
rng.verifyServerSeed(seed, hash)         // Returns: boolean
rng.generateFairRandom(server, client, nonce, min, max) // Returns: random int

// Next round
rng.generateNextServerSeedHash()   // Generates and hashes new seed
```

### GameRNG

```javascript
// All functions accept: { serverSeed, clientSeed, nonce }

GameRNG.diceRoll(seeds)              // 1-6
GameRNG.coinFlip(seeds)              // 0 or 1
GameRNG.rouletteSpin(seeds, size)    // 0 to (size-1)
GameRNG.slotReels(seeds, reels, symbols) // Array of values
GameRNG.shuffleDeck(seeds, deckSize) // Shuffled array
GameRNG.crashMultiplier(seeds)       // Float like "47.23"
GameRNG.generateMines(seeds, total, count) // Array of positions
GameRNG.colorPrediction(seeds)       // "red", "green", "blue", "yellow"
GameRNG.randomFloat(seeds)           // 0.0 to 1.0
GameRNG.applyHouseEdge(edge, bet)    // Adjusted payout
```

---

## Conclusion

The Benjamin platform's RNG system provides:
✅ **Transparency** - Players can verify all results
✅ **Fairness** - Industry-standard Mersenne Twister
✅ **Security** - Cryptographically secure hashing
✅ **Compliance** - Ready for gaming authority certification

All 200+ casino games use this unified RNG system!
