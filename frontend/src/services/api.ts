import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';

// Use Vite env var if provided; fallback to localhost for dev
const API_HOST = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
const API_BASE = `${API_HOST.replace(/\/$/, '')}/api`;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token to requests if present
api.interceptors.request.use((config: AxiosRequestConfig) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      if (!config.headers) config.headers = {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore localStorage errors
    // eslint-disable-next-line no-console
    console.warn('Unable to read token from localStorage', e);
  }
  return config;
});

// Basic response interceptor to handle auth expirations
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        // clear token and reload to force auth flow
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          // reload to ensure app picks up logged-out state
          window.location.href = '/login';
        }
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password }),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me')
};

// Games
export const gamesAPI = {
  getGames: () => api.get('/games'),
  placeBet: (gameType: string, amount: number, clientSeed: string, betData: any) =>
    api.post('/games/bet', { gameType, amount, clientSeed, betData }),
  getHistory: () => api.get('/games/history'),
  verify: (betId: string, serverSeed: string) => api.post('/games/verify', { betId, serverSeed })
};

// Wallet
export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  deposit: (amount: number) => api.post('/wallet/deposit', { amount }),
  verifyDeposit: (orderId: string, paymentId: string, signature: string) =>
    api.post('/wallet/deposit/verify', { orderId, paymentId, signature }),
  withdraw: (amount: number, accountDetails: any) => api.post('/wallet/withdraw', { amount, accountDetails }),
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
  approveWithdrawal: (transactionId: string) => api.post(`/admin/withdrawals/${transactionId}/approve`)
};

export default api;
