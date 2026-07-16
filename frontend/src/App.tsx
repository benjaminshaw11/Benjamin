import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useWalletStore } from './store/walletStore';
import { authAPI, walletAPI } from './services/api';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import Sports from './pages/Sports';
import Wallet from './pages/Wallet';
import Admin from './pages/Admin';
import DiceGame from './pages/games/DiceGame';

function App() {
  const { isAuthenticated, setUser, logout } = useAuthStore();
  const { setBalance } = useWalletStore();

  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated) {
        try {
          const userResponse = await authAPI.me();
          setUser(userResponse.data.user || null);

          // wallet may be missing; guard parsing
          const balanceVal = userResponse.data?.wallet?.balance;
          if (typeof balanceVal !== 'undefined') {
            const parsed = parseFloat(balanceVal);
            if (!Number.isNaN(parsed)) setBalance(parsed);
          }
        } catch (err: any) {
          console.error('Failed to load user data', err);
          // If unauthorized clear state and redirect to login
          if (err?.response?.status === 401) {
            logout();
          }
        }
      }
    };

    loadUserData();
    // include setters so React Hook linter is happy
  }, [isAuthenticated, setUser, setBalance, logout]);

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/dice" element={<DiceGame />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
