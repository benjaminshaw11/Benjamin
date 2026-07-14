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
  const { isAuthenticated, setUser } = useAuthStore();
  const { setBalance } = useWalletStore();

  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated) {
        try {
          const userResponse = await authAPI.me();
          setUser(userResponse.data.user);
          setBalance(parseFloat(userResponse.data.wallet.balance));
        } catch (err) {
          console.error('Failed to load user data', err);
        }
      }
    };

    loadUserData();
  }, [isAuthenticated]);

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
