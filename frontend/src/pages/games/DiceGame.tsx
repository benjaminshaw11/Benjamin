import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import { gamesAPI } from '../../services/api';
import { Dice5 } from 'lucide-react';

function DiceGame() {
  const { user } = useAuthStore();
  const { balance, subtractBalance, addBalance } = useWalletStore();
  const [amount, setAmount] = useState(100);
  const [targetMultiplier, setTargetMultiplier] = useState(2);
  const [gameResult, setGameResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [betHistory, setBetHistory] = useState<any[]>([]);

  const handleBet = async () => {
    if (amount > balance) {
      alert('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const clientSeed = Math.random().toString();
      const response = await gamesAPI.placeBet('dice', amount, clientSeed, {
        targetMultiplier
      });

      setGameResult(response.data);
      subtractBalance(amount);
      if (response.data.won) {
        addBalance(response.data.payout);
      }
      setBetHistory([response.data, ...betHistory]);
    } catch (err) {
      alert('Bet failed: ' + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  const potential_payout = amount * targetMultiplier;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Dice5 className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Dice Game</h1>
        </div>

        {/* Game Area */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Game Interface */}
          <div className="md:col-span-2 bg-slate-800 rounded-lg p-6 border border-slate-700">
            {/* Balance */}
            <div className="mb-6 p-4 bg-slate-900 rounded text-center">
              <p className="text-slate-400 text-sm">Balance</p>
              <p className="text-2xl font-bold text-green-400">₹{balance.toFixed(2)}</p>
            </div>

            {/* Bet Amount */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">Bet Amount (₹)</label>
              <input
                type="number"
                min="10"
                max="100000"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-yellow-400"
              />
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[100, 500, 1000, 5000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Multiplier */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">Target Multiplier (1-6)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((mult) => (
                  <button
                    key={mult}
                    onClick={() => setTargetMultiplier(mult)}
                    className={`flex-1 py-3 rounded font-bold text-lg ${
                      targetMultiplier === mult
                        ? 'bg-yellow-400 text-slate-900'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {mult}x
                  </button>
                ))}
              </div>
            </div>

            {/* Payout Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-900 rounded">
              <div>
                <p className="text-slate-400 text-sm">Potential Payout</p>
                <p className="text-xl font-bold text-green-400">₹{potential_payout.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Probability</p>
                <p className="text-xl font-bold text-blue-400">{((100 / targetMultiplier).toFixed(1))}%</p>
              </div>
            </div>

            {/* Bet Button */}
            <button
              onClick={handleBet}
              disabled={loading || amount > balance}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 text-slate-900 font-bold rounded-lg text-lg transition"
            >
              {loading ? 'Rolling...' : 'Roll Dice'}
            </button>
          </div>

          {/* Result Panel */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            {gameResult ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-2">Dice Result</p>
                  <div className="text-6xl font-bold text-yellow-400 mb-4">{gameResult.gameResult.dice}</div>
                </div>

                <div className={`p-4 rounded-lg text-center ${
                  gameResult.won ? 'bg-green-900 border border-green-500' : 'bg-red-900 border border-red-500'
                }`}>
                  <p className={`text-xl font-bold ${
                    gameResult.won ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {gameResult.won ? '🎉 WIN!' : '❌ LOSS'}
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${
                    gameResult.won ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {gameResult.won ? '+' : '-'}₹{Math.abs(gameResult.won ? gameResult.payout - amount : amount).toFixed(2)}
                  </p>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>Verification:</p>
                  <code className="block bg-slate-900 p-2 rounded overflow-auto">
                    {gameResult.verificationData.random.toFixed(6)}
                  </code>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <Dice5 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Results will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiceGame;
