// frontend/src/lib/authClient.js
// Client helper: in-memory access token + httpOnly refresh cookie flow
// Usage: import { authClient } from './lib/authClient';

let accessToken = null;
let refreshing = null; // promise when refresh in progress

function setAccessToken(token) {
  accessToken = token;
}

function getAccessToken() {
  return accessToken;
}

async function loginDev(userId, isAdmin = false) {
  // Dev login (server sets refresh cookie) - only if server DEV_AUTH_ENABLED
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, isAdmin })
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  setAccessToken(data.accessToken);
  return data;
}

async function refresh() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!res.ok) {
      refreshing = null;
      throw new Error('Refresh failed');
    }
    const data = await res.json();
    setAccessToken(data.accessToken);
    refreshing = null;
    return data.accessToken;
  })();
  return refreshing;
}

async function apiFetch(input, init = {}) {
  // attach Authorization header
  init.headers = init.headers || {};
  if (accessToken) init.headers['Authorization'] = `Bearer ${accessToken}`;
  // include credentials for refresh cookie usage if needed
  init.credentials = init.credentials || 'include';

  let res = await fetch(input, init);
  if (res.status !== 401) return res;

  // Try refresh once
  try {
    await refresh();
  } catch (e) {
    // refresh failed; surface 401
    return res;
  }

  // Retry original request with new token
  init.headers['Authorization'] = `Bearer ${accessToken}`;
  res = await fetch(input, init);
  return res;
}

function connectSocket(io, opts = {}) {
  // io is socket.io-client instance function
  // opts: { authHeader: 'Bearer ...' } or none
  const token = getAccessToken();
  const socket = io(window.location.origin, { auth: { token }, transports: ['websocket'] });
  socket.on('connect_error', async (err) => {
    // if auth error, try refresh and reconnect once
    if (err && err.message && err.message.indexOf('jwt') !== -1) {
      try {
        await refresh();
        const newToken = getAccessToken();
        socket.auth = { token: newToken };
        socket.connect();
      } catch (e) {
        // give up; application should redirect to login
        console.warn('Socket reconnect failed after refresh', e.message);
      }
    }
  });
  return socket;
}

async function logout() {
  // call server to revoke refresh token and clear cookie
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  accessToken = null;
}

export const authClient = {
  setAccessToken,
  getAccessToken,
  loginDev,
  refresh,
  apiFetch,
  connectSocket,
  logout
};
