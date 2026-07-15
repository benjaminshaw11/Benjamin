# Auth client (frontend)

This folder contains a small client helper to work with the server refresh-token + httpOnly cookie flow.

Files added:
- frontend/src/lib/authClient.js  — in-memory access token, apiFetch that auto-refreshes, socket connector
- frontend/src/hooks/useAuth.js  — small React hook to integrate with the helper

Quick usage:

- Login (dev mode):
  const { loginDev } = useAuth();
  await loginDev('<user-uuid>', false);

- Make API call that auto-refreshes on 401:
  const res = await authClient.apiFetch('/api/manual-deposits/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount_paise: 10000, method: 'upi', provider_txn_id: 'TXN123' })
  });

- Connect socket.io with token and automatic reconnect after refresh:
  import { authClient } from '../lib/authClient';
  import { io } from 'socket.io-client';
  const socket = authClient.connectSocket(io);

Security notes:
- accessToken is stored in-memory only; refresh token is an httpOnly cookie managed by the server.
- Do not enable DEV_AUTH_ENABLED in production.
