/**
 * Game Controller
 * Handles all casino game logic using RNG system
 */

const { GameRNG, ProvablyFairRNG } = require('../utils/rng');
const Game = require('../models/Game');
const Bet = require('../models/Bet');
const User = require('../models/User');

class GameController {
  /**
   * Initialize a new game session
   * POST /api/games/session/init
   */
  static async initializeSession(req, res) {
    try {
      const { userId } = req.user;
      const rng = new ProvablyFairRNG();

      // Generate server seed and hash
      const serverSeed = rng.generateServerSeed();
      const serverSeedHash = rng.generateServerSeedHash(serverSeed);

      // Create game session
      const gameSession = await Game.create({
        userId: userId,
        serverSeed: serverSeed,
        serverSeedHash: serverSeedHash,
        clientSeed: null,
        nonce: 0,
        status: 'pending',
        totalBets: 0,
        totalWinnings: 0,
      });

      res.json({
        sessionId: gameSession.id,
        serverSeedHash: serverSeedHash,
        message: 'Game session initialized. Please provide your client seed.'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Set client seed for game session
   * POST /api/games/session/:sessionId/client-seed
   */
  static async setClientSeed(req, res) {
    try {
      const { sessionId } = req.params;
      const { clientSeed } = req.body;
      const { userId } = req.user;

      if (!clientSeed || clientSeed.length < 5) {
        return res.status(400).json({ error: 'Client seed must be at least 5 characters' });
      }

      const gameSession = await Game.findByPk(sessionId);
      if (!gameSession || gameSession.userId !== userId) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      gameSession.clientSeed = clientSeed;
      gameSession.status = 'active';
      await gameSession.save();

      res.json({
        message: 'Client seed set. Ready to play!',
        sessionId: gameSession.id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DICE GAME
   * POST /api/games/dice/bet
   */
  static async diceBet(req, res) {
    try {
      const { sessionId, amount, prediction } = req.body;
      const { userId } = req.user;

      // Validate inputs
      if (amount < 1 || amount > 10000) {
        return res.status(400).json({ error: 'Bet amount must be between 1 and 10000' });
      }

      if (prediction < 1 || prediction > 6) {
        return res.status(400).json({ error: 'Prediction must be between 1 and 6' });
      }

      // Get game session
      const gameSession = await Game.findByPk(sessionId);
      if (!gameSession || gameSession.userId !== userId || gameSession.status !== 'active') {
        return res.status(400).json({ error: 'Invalid game session' });
      }

      // Check user balance
      const user = await User.findByPk(userId);
      if (user.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Increment nonce
      gameSession.nonce += 1;

      // Generate dice result using RNG
      const seeds = {
        serverSeed: gameSession.serverSeed,
        clientSeed: gameSession.clientSeed,
        nonce: gameSession.nonce
      };

      const diceResult = GameRNG.diceRoll(seeds);

      // Determine win/loss
      const isWin = diceResult === prediction;
      const payout = isWin ? amount * 6 : 0; // 6:1 payout for 1/6 odds
      const profit = payout - amount;

      // Update user balance
      user.balance -= amount;
      user.balance += payout;
      await user.save();

      // Save bet record
      const bet = await Bet.create({
        gameId: gameSession.id,
        userId: userId,
        gameType: 'dice',
        amount: amount,
        prediction: prediction,
        result: diceResult,
        isWin: isWin,
        payout: payout,
        profit: profit,
        nonce: gameSession.nonce
      });

      // Update game session
      gameSession.totalBets += 1;
      gameSession.totalWinnings += profit;
      await gameSession.save();

      res.json({
        result: diceResult,
        prediction: prediction,
        isWin: isWin,
        betAmount: amount,
        payout: payout,
        profit: profit,
        userBalance: user.balance,
        nonce: gameSession.nonce
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * ROULETTE GAME
   * POST /api/games/roulette/bet
   */
  static async rouletteBet(req, res) {
    try {
      const { sessionId, amount, prediction, wheelType } = req.body;
      const { userId } = req.user;

      if (amount < 1 || amount > 10000) {
        return res.status(400).json({ error: 'Invalid bet amount' });
      }

      const gameSession = await Game.findByPk(sessionId);
      if (!gameSession || gameSession.userId !== userId) {
        return res.status(400).json({ error: 'Invalid session' });
      }

      const user = await User.findByPk(userId);
      if (user.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      gameSession.nonce += 1;
      const wheelSize = wheelType === 'american' ? 38 : 37;

      // Validate prediction
      if (prediction < 0 || prediction >= wheelSize) {
        return res.status(400).json({ error: `Invalid prediction for ${wheelType} roulette` });
      }

      const seeds = {
        serverSeed: gameSession.serverSeed,
        clientSeed: gameSession.clientSeed,
        nonce: gameSession.nonce
      };

      const spinResult = GameRNG.rouletteSpin(seeds, wheelSize);

      // Roulette pays 36:1 for straight bets
      const isWin = spinResult === prediction;
      const payout = isWin ? amount * 36 : 0;
      const profit = payout - amount;

      user.balance -= amount;
      user.balance += payout;
      await user.save();

      await Bet.create({
        gameId: gameSession.id,
        userId: userId,
        gameType: `roulette_${wheelType}`,
        amount: amount,
        prediction: prediction,
        result: spinResult,
        isWin: isWin,
        payout: payout,
        profit: profit,
        nonce: gameSession.nonce
      });

      gameSession.totalBets += 1;
      gameSession.totalWinnings += profit;
      await gameSession.save();

      res.json({
        result: spinResult,
        prediction: prediction,
        isWin: isWin,
        betAmount: amount,
        payout: payout,
        profit: profit,
        userBalance: user.balance
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * CRASH GAME
   * POST /api/games/crash/bet
   */
  static async crashBet(req, res) {
    try {
      const { sessionId, amount, cashOutAt } = req.body;
      const { userId } = req.user;

      const gameSession = await Game.findByPk(sessionId);
      if (!gameSession || gameSession.userId !== userId) {
        return res.status(400).json({ error: 'Invalid session' });
      }

      const user = await User.findByPk(userId);
      if (user.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      gameSession.nonce += 1;

      const seeds = {
        serverSeed: gameSession.serverSeed,
        clientSeed: gameSession.clientSeed,
        nonce: gameSession.nonce
      };

      // Generate crash multiplier
      const crashMultiplier = parseFloat(GameRNG.crashMultiplier(seeds));

      // Determine if player cashed out before crash
      const isWin = cashOutAt < crashMultiplier;
      const payout = isWin ? amount * cashOutAt : 0;
      const profit = payout - amount;

      user.balance -= amount;
      user.balance += payout;
      await user.save();

      await Bet.create({
        gameId: gameSession.id,
        userId: userId,
        gameType: 'crash',
        amount: amount,
        prediction: cashOutAt,
        result: crashMultiplier,
        isWin: isWin,
        payout: payout,
        profit: profit,
        nonce: gameSession.nonce
      });

      gameSession.totalBets += 1;
      gameSession.totalWinnings += profit;
      await gameSession.save();

      res.json({
        crashMultiplier: crashMultiplier,
        cashOutAt: cashOutAt,
        isWin: isWin,
        betAmount: amount,
        payout: payout,
        profit: profit,
        userBalance: user.balance
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * MINES GAME
   * POST /api/games/mines/start
   */
  static async minesStart(req, res) {
    try {
      const { sessionId, amount, mineCount } = req.body;
      const { userId } = req.user;

      if (mineCount < 1 || mineCount > 24) {
        return res.status(400).json({ error: 'Mine count must be between 1 and 24' });
      }

      const gameSession = await Game.findByPk(sessionId);
      if (!gameSession || gameSession.userId !== userId) {
        return res.status(400).json({ error: 'Invalid session' });
      }

      gameSession.nonce += 1;

      const seeds = {
        serverSeed: gameSession.serverSeed,
        clientSeed: gameSession.clientSeed,
        nonce: gameSession.nonce
      };

      // Generate mine positions
      const mines = GameRNG.generateMines(seeds, 25, mineCount);

      // Store mines in session for reveal
      gameSession.gameData = JSON.stringify({ mines, mineCount });
      await gameSession.save();

      res.json({
        message: 'Mines game started',
        gridSize: 25,
        mineCount: mineCount,
        betAmount: amount,
        note: 'Click squares to reveal. Avoid mines!'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * MINES GAME - Reveal square
   * POST /api/games/mines/reveal
   */
  static async minesReveal(req, res) {
    try {
      const { sessionId, squareIndex } = req.body;
      const { userId } = req.user;

      const gameSession = await Game.findByPk(sessionId);
      if (!gameSession || gameSession.userId !== userId) {
        return res.status(400).json({ error: 'Invalid session' });
      }

      const gameData = JSON.parse(gameSession.gameData);
      const { mines } = gameData;

      const isMine = mines.includes(squareIndex);

      if (isMine) {
        res.json({
          squareIndex: squareIndex,
          isMine: true,
          message: 'Boom! You hit a mine. Game over.',
          payout: 0
        });
      } else {
        res.json({
          squareIndex: squareIndex,
          isMine: false,
          message: 'Safe! Continue or cash out.',
          payout: 'TBD'
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * COLOR PREDICTION GAME
   * POST /api/games/color/bet
   */
  static async colorBet(req, res) {
    try {
      const { sessionId, amount, prediction } = req.body;
      const { userId } = req.user;

      const validColors = ['red', 'green', 'blue', 'yellow'];
      if (!validColors.includes(prediction)) {
        return res.status(400).json({ error: 'Invalid color prediction' });
      }

      const gameSession = await Game.findByPk(sessionId);
      if (!gameSession || gameSession.userId !== userId) {
        return res.status(400).json({ error: 'Invalid session' });
      }

      const user = await User.findByPk(userId);
      if (user.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      gameSession.nonce += 1;

      const seeds = {
        serverSeed: gameSession.serverSeed,
        clientSeed: gameSession.clientSeed,
        nonce: gameSession.nonce
      };

      const result = GameRNG.colorPrediction(seeds);

      const isWin = result === prediction;
      const payout = isWin ? amount * 4 : 0; // 4:1 payout for 1/4 odds
      const profit = payout - amount;

      user.balance -= amount;
      user.balance += payout;
      await user.save();

      await Bet.create({
        gameId: gameSession.id,
        userId: userId,
        gameType: 'color_prediction',
        amount: amount,
        prediction: prediction,
        result: result,
        isWin: isWin,
        payout: payout,
        profit: profit,
        nonce: gameSession.nonce
      });

      gameSession.totalBets += 1;
      gameSession.totalWinnings += profit;
      await gameSession.save();

      res.json({
        result: result,
        prediction: prediction,
        isWin: isWin,
        betAmount: amount,
        payout: payout,
        profit: profit,
        userBalance: user.balance
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get game history
   * GET /api/games/:sessionId/history
   */
  static async getGameHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const { userId } = req.user;

      const gameSession = await Game.findByPk(sessionId);
      if (!gameSession || gameSession.userId !== userId) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      const bets = await Bet.findAll({
        where: { gameId: sessionId },
        order: [['createdAt', 'ASC']]
      });

      res.json({
        sessionId: sessionId,
        totalBets: bets.length,
        totalWinnings: gameSession.totalWinnings,
        bets: bets
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Verify game fairness (after game ends)
   * POST /api/games/:sessionId/verify
   */
  static async verifyFairness(req, res) {
    try {
      const { sessionId } = req.params;
      const { userId } = req.user;

      const gameSession = await Game.findByPk(sessionId);
      if (!gameSession || gameSession.userId !== userId) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      const rng = new ProvablyFairRNG();

      // Verify server seed
      const isValid = rng.verifyServerSeed(
        gameSession.serverSeed,
        gameSession.serverSeedHash
      );

      if (!isValid) {
        return res.json({
          verified: false,
          reason: 'Server seed hash mismatch'
        });
      }

      // Get all bets for this session
      const bets = await Bet.findAll({
        where: { gameId: sessionId }
      });

      // Verify each bet
      const verifiedBets = bets.map(bet => {
        const seeds = {
          serverSeed: gameSession.serverSeed,
          clientSeed: gameSession.clientSeed,
          nonce: bet.nonce
        };

        let recalculatedResult;
        switch (bet.gameType) {
          case 'dice':
            recalculatedResult = GameRNG.diceRoll(seeds);
            break;
          case 'roulette_european':
            recalculatedResult = GameRNG.rouletteSpin(seeds, 37);
            break;
          case 'roulette_american':
            recalculatedResult = GameRNG.rouletteSpin(seeds, 38);
            break;
          case 'color_prediction':
            recalculatedResult = GameRNG.colorPrediction(seeds);
            break;
          default:
            recalculatedResult = null;
        }

        return {
          nonce: bet.nonce,
          gameType: bet.gameType,
          originalResult: bet.result,
          recalculatedResult: recalculatedResult,
          verified: bet.result === recalculatedResult || bet.result === String(recalculatedResult)
        };
      });

      res.json({
        sessionId: sessionId,
        verified: isValid,
        serverSeedHash: gameSession.serverSeedHash,
        clientSeed: gameSession.clientSeed,
        totalBets: verifiedBets.length,
        verifiedBets: verifiedBets
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * End game session
   * POST /api/games/:sessionId/end
   */
  static async endSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { userId } = req.user;

      const gameSession = await Game.findByPk(sessionId);
      if (!gameSession || gameSession.userId !== userId) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      gameSession.status = 'completed';
      await gameSession.save();

      res.json({
        message: 'Game session ended',
        sessionId: sessionId,
        totalBets: gameSession.totalBets,
        totalWinnings: gameSession.totalWinnings,
        serverSeed: gameSession.serverSeed // Revealed after game ends
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = GameController;
