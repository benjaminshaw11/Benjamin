import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

export default function ManualDepositForm({ apiBase = '/api', jwt, userId }) {
  const [amount, setAmount] = useState('');
  const [txnId, setTxnId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tx, setTx] = useState(null); // { tx_id, status, message }
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!jwt) return;
    const s = io(window.location.origin, { auth: { token: jwt } });
    s.on('connect', () => {
      // send auth; server will decode and put this socket into user's room
      s.emit('auth', { token: jwt });
    });
    s.on('transaction:update', (payload) => {
      if (tx && payload.tx_id === tx.tx_id) setTx(prev => ({ ...prev, ...payload }));
    });
    setSocket(s);
    return () => s.disconnect();
  }, [jwt]);

  useEffect(() => {
    if (!tx) return;
    let cancelled = false;
    let interval = 15000;
    async function poll() {
      try {
        const res = await fetch(`${apiBase}/manual-deposits/status/${tx.tx_id}`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setTx(data);
        if (data.status === 'pending_manual') {
          setTimeout(poll, interval);
          interval = Math.min(60000, interval * 1.5);
        }
      } catch (e) { /* ignore */ }
    }
    if (!socket || !socket.connected) poll();
    return () => { cancelled = true; };
  }, [tx, socket, apiBase, jwt]);

  async function submit(e) {
    e.preventDefault();
    if (!amount || !txnId) return alert('Amount and transaction id required');
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/manual-deposits/submit`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ user_id: userId, amount_paise: Math.round(parseFloat(amount)*100), method: 'upi', provider_txn_id: txnId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submit failed');
      setTx({ tx_id: data.tx_id, status: 'pending_manual', message: data.message });
    } catch (err) {
      alert(err.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  if (tx) {
    return (
      <div>
        <h3>Deposit Reference: {tx.tx_id}</h3>
        <p>Status: <strong>{tx.status}</strong></p>
        <p>{tx.message}</p>
        {tx.status === 'pending_manual' ? <p>We will notify you when confirmed. Expected: within 24h.</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <label>Amount (INR)</label>
      <input value={amount} onChange={e=>setAmount(e.target.value)} disabled={submitting} />
      <label>Transaction ID (UPI / Bank)</label>
      <input value={txnId} onChange={e=>setTxnId(e.target.value)} disabled={submitting} />
      <button type="submit" disabled={submitting}>Submit</button>
    </form>
  );
}
