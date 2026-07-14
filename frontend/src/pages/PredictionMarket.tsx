import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import axios from 'axios';
import { TrendingUp, TrendingDown } from 'lucide-react';

function PredictionMarket() {
  const { user } = useAuthStore();
  const { balance, subtractBalance, addBalance } = useWalletStore();
  const [markets, setMarkets] = useState<any[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<any>(null);
  const [prediction, setPrediction] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [userBets, setUserBets] = useState<any[]>([]);

  useEffect(() => {
    loadMarkets();
    loadUserBets();
  }, []);

  const loadMarkets = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/prediction/markets');
      setMarkets(response.data);
    } catch (err) {
      console.error('Failed to load markets', err);
    }
  };

  const loadUserBets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/prediction/my-bets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserBets(response.data);
    } catch (err) {
      console.error('Failed to load bets', err);
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedMarket || amount > balance) {
      alert('Invalid bet');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/prediction/bet',
        { marketId: selectedMarket.id, prediction, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      subtractBalance(amount);
      setSelectedMarket(null);
      setPrediction('yes');
      setAmount(100);
      alert('Bet placed successfully!');
      loadMarkets();
      loadUserBets();
    } catch (err) {
      alert('Failed to place bet: ' + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  const marketCategories = ['sports', 'crypto', 'politics', 'entertainment', 'weather', 'other'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Prediction Markets</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Markets List */}
          <div className="md:col-span-2 space-y-4">
            {markets.map((market) => (
              <div
                key={market.id}
                onClick={() => setSelectedMarket(market)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedMarket?.id === market.id
                    ? 'border-yellow-400 bg-slate-750'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-800'
                }`}
              >
                <h3 className="text-lg font-bold text-white mb-2">{market.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{market.description}</p>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-slate-400 text-xs">YES Odds</p>
                    <p className="text-lg font-bold text-green-400">{market.yesOdds}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">NO Odds</p>
                    <p className="text-lg font-bold text-red-400">{market.noOdds}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Volume</p>
                    <p className="text-lg font-bold text-white">₹{(market.totalVolume / 100000).toFixed(1)}k</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Status</p>
                    <p className={`text-lg font-bold ${
                      market.status === 'open' ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {market.status.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Betting Panel */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-fit">
            {selectedMarket ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Place Bet</h2>
                  <p className="text-sm text-slate-400 mb-4">{selectedMarket.title}</p>
                </div>

                {/* Prediction Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">Your Prediction</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPrediction('yes')}
                      className={`py-3 rounded font-bold transition ${
                        prediction === 'yes'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 mx-auto mb-1" />
                      YES
                    </button>
                    <button
                      onClick={() => setPrediction('no')}
                      className={`py-3 rounded font-bold transition ${
                        prediction === 'no'
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4 mx-auto mb-1" />
                      NO
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    min="10"
                    max="100000"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600"
                  />
                </div>

                {/* Odds Info */}
                <div className="p-3 bg-slate-900 rounded">
                  <p className="text-slate-400 text-xs mb-2">Odds</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {prediction === 'yes' ? selectedMarket.yesOdds : selectedMarket.noOdds}
                  </p>
                  <p className="text-slate-400 text-xs mt-2">
                    Potential Payout: ₹{(amount * (prediction === 'yes' ? selectedMarket.yesOdds : selectedMarket.noOdds)).toFixed(2)}
                  </p>
                </div>

                {/* Bet Button */}
                <button
                  onClick={handlePlaceBet}
                  disabled={loading || amount > balance}
                  className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 text-slate-900 font-bold rounded-lg transition"
                >
                  {loading ? 'Placing Bet...' : 'Place Bet'}
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <p>Select a market to place a bet</p>
              </div>
            )}
          </div>
        </div>

        {/* Your Bets */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-4">Your Bets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userBets.map((bet) => (
              <div key={bet.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h3 className="font-semibold text-white mb-2">{bet.PredictionMarket.title}</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-400">Prediction: {bet.prediction.toUpperCase()}</p>
                    <p className="text-sm text-slate-400">Amount: ₹{bet.amount}</p>
                  </div>
                  <div className={`text-right ${
                    bet.status === 'won' ? 'text-green-400' :
                    bet.status === 'lost' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    <p className="font-bold text-lg">{bet.status.toUpperCase()}</p>
                    {bet.status === 'won' && <p>+₹{bet.payout}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PredictionMarket;
