import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { gamesAPI } from '../../services/api';
import { TrendingUp } from 'lucide-react';

function CrashGame() {
  const { balance, subtractBalance, addBalance } = useWalletStore();
  const [amount, setAmount] = useState(100);
  const [cashoutMultiplier, setCashoutMultiplier] = useState(2);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'crashed'>('idle');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (gameState === 'running') {
      let multiplier = 1.0;
      const interval = setInterval(() => {
        multiplier += 0.01;
        setCurrentMultiplier(parseFloat(multiplier.toFixed(2)));

        // Random crash between 1-10x
        if (Math.random() < 0.05 || multiplier > 10) {
          clearInterval(interval);
          setGameState('crashed');
          setResult({ multiplier, crashed: true, won: false });
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [gameState]);

  const handleBet = async () => {
    if (amount > balance) {
      alert('Insufficient balance');
      return;
    }

    subtractBalance(amount);
    setGameState('running');
    setCurrentMultiplier(1.0);
    setResult(null);
  };

  const handleCashout = () => {
    if (gameState === 'running' && currentMultiplier >= cashoutMultiplier) {
      const payout = amount * currentMultiplier;
      setResult({ multiplier: currentMultiplier, won: true, payout });
      addBalance(payout);
      setGameState('crashed');
    }
  };

  const handleReset = () => {
    setGameState('idle');
    setCurrentMultiplier(1.0);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Crash Game</h1>
        </div>

        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          {/* Chart Area */}
          <div className="mb-8 p-6 bg-gradient-to-b from-blue-900 to-slate-900 rounded-lg min-h-48 flex items-end justify-center relative">
            <div className="text-center">
              <p className="text-blue-300 text-sm mb-2">Multiplier</p>
              <p className={`text-6xl font-bold ${
                gameState === 'running' ? 'text-blue-400 animate-pulse' : 'text-white'
              }`}>
                {currentMultiplier.toFixed(2)}x
              </p>
              {gameState === 'crashed' && (
                <p className="text-red-400 text-xl font-bold mt-2">CRASHED!</p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Bet Amount (₹)</label>
              <input
                type="number"
                disabled={gameState !== 'idle'}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Auto Cashout at (x)</label>
              <input
                type="number"
                disabled={gameState !== 'idle'}
                value={cashoutMultiplier}
                onChange={(e) => setCashoutMultiplier(parseFloat(e.target.value))}
                className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 disabled:opacity-50"
              />
            </div>

            <div className="flex gap-4">
              {gameState === 'idle' ? (
                <button
                  onClick={handleBet}
                  disabled={amount > balance}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition"
                >
                  BET
                </button>
              ) : gameState === 'running' ? (
                <button
                  onClick={handleCashout}
                  className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition"
                >
                  CASHOUT @ {currentMultiplier.toFixed(2)}x
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition"
                >
                  PLAY AGAIN
                </button>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`mt-6 p-4 rounded-lg text-center ${
              result.won ? 'bg-green-900 border border-green-500' : 'bg-red-900 border border-red-500'
            }`}>
              <p className={`text-xl font-bold ${
                result.won ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.won ? '🎉 You Won!' : '❌ Game Over'}
              </p>
              {result.won && (
                <p className="text-green-300 mt-2">+₹{result.payout.toFixed(2)}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CrashGame;
