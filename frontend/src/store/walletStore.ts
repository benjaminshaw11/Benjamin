import { create } from 'zustand';

interface WalletStore {
  balance: number;
  currency: string;
  locked: number;
  setBalance: (balance: number) => void;
  setCurrency: (currency: string) => void;
  addBalance: (amount: number) => void;
  subtractBalance: (amount: number) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  balance: 0,
  currency: 'INR',
  locked: 0,
  setBalance: (balance) => set({ balance }),
  setCurrency: (currency) => set({ currency }),
  addBalance: (amount) => set((state) => ({ balance: state.balance + amount })),
  subtractBalance: (amount) => set((state) => ({ balance: state.balance - amount }))
}));
