import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me')
};

// Games
export const gamesAPI = {
  getGames: () => api.get('/games'),
  placeBet: (gameType: string, amount: number, clientSeed: string, betData: any) =>
    api.post('/games/bet', { gameType, amount, clientSeed, betData }),
  getHistory: () => api.get('/games/history'),
  verify: (betId: string, serverSeed: string) =>
    api.post('/games/verify', { betId, serverSeed })
};

// Wallet
export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  deposit: (amount: number) => api.post('/wallet/deposit', { amount }),
  verifyDeposit: (orderId: string, paymentId: string, signature: string) =>
    api.post('/wallet/deposit/verify', { orderId, paymentId, signature }),
  withdraw: (amount: number, accountDetails: any) =>
    api.post('/wallet/withdraw', { amount, accountDetails }),
  getTransactions: () => api.get('/wallet/transactions')
};

// Sports
export const sportsAPI = {
  getOdds: () => api.get('/sports/odds'),
  placeBet: (fixtureId: number, amount: number, betType: string, selection: string) =>
    api.post('/sports/bet', { fixtureId, amount, betType, selection }),
  getMarkets: () => api.get('/sports/markets')
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  suspendUser: (userId: string) => api.post(`/admin/users/${userId}/suspend`),
  getPendingWithdrawals: () => api.get('/admin/withdrawals/pending'),
  approveWithdrawal: (transactionId: string) =>
    api.post(`/admin/withdrawals/${transactionId}/approve`)
};

export default api;
