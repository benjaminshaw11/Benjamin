import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  username: string;
  kycVerified: boolean;
  status: string;
  totalDeposits: number;
  totalBets: number;
  totalWinnings: number;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: !!(typeof window !== 'undefined' && localStorage.getItem('token')),
  login: (token, user) => {
    try {
      localStorage.setItem('token', token);
    } catch (e) {
      // ignore storage write errors
    }
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    try {
      localStorage.removeItem('token');
    } catch (e) {
      // ignore
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
  setUser: (user) => set({ user })
}));
