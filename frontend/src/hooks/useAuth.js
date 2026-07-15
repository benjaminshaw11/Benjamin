// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authClient } from '../lib/authClient';

export function useAuth() {
  const [token, setToken] = useState(authClient.getAccessToken());

  useEffect(() => {
    const id = setInterval(() => {
      setToken(authClient.getAccessToken());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const loginDev = async (userId, isAdmin=false) => {
    const data = await authClient.loginDev(userId, isAdmin);
    setToken(data.accessToken);
    return data;
  };

  const logout = async () => {
    await authClient.logout();
    setToken(null);
  };

  return { token, loginDev, logout, authClient };
}
