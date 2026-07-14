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
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  login: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },
  setUser: (user) => set({ user })
}));
