import React, { useState, useEffect, useMemo } from 'react';
import { authClient } from '../lib/authClient';
import { useAuth } from '../hooks/useAuth';

export default function AdminDeposits() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [socket, setSocket] = useState(null);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/deposits/pending?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`;
      const res = await authClient.apiFetch(url);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
      alert('Failed to load pending deposits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(); }, [q, limit, offset]);

  useEffect(() => {
    if (!token) return;
    const s = authClient.connectSocket(window.io || require('socket.io-client'));
    s.on('transaction:update', (payload) => {
      if (!payload || !payload.tx_id) return;
      setRows(prev => prev.filter(r => r.id !== payload.tx_id));
    });
    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  const approve = async (id, amount) => {
    const matched = window.prompt('Matched bank txn id (optional)');
    if (matched === null) return; // cancelled
    if (!window.confirm('Approve this deposit and credit wallet?')) return;
    try {
      const res = await authClient.apiFetch(`/api/manual-deposits/admin/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matched_bank_txn_id: matched })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approve failed');
      // remove row locally
      setRows(prev => prev.filter(r => r.id !== id));
      alert('Approved and credited');
    } catch (e) {
      console.error(e);
      alert('Approve failed: ' + (e.message || 'error'));
    }
  };

  const reject = async (id) => {
    const reason = window.prompt('Reason for rejection (required)');
    if (!reason) return; // cancelled or empty
    if (!window.confirm('Reject this deposit?')) return;
    try {
      const res = await authClient.apiFetch(`/api/manual-deposits/admin/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reject failed');
      setRows(prev => prev.filter(r => r.id !== id));
      alert('Rejected');
    } catch (e) {
      console.error(e);
      alert('Reject failed: ' + (e.message || 'error'));
    }
  };

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Pending Manual Deposits</h2>
      <div style={{ marginBottom: 10 }}>
        <input placeholder="Search txn id or user email" value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={()=>{ setOffset(0); fetchPage(); }}>Search</button>
      </div>
      <div>
        {loading ? <div>Loading…</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Tx ID</th>
                <th>User</th>
                <th>Provider Txn</th>
                <th>Amount</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 8, fontFamily: 'monospace' }}>{r.id}</td>
                  <td style={{ padding: 8 }}>{r.user_email || r.user_id}</td>
                  <td style={{ padding: 8 }}>{r.provider_payment_id}</td>
                  <td style={{ padding: 8 }}>{(r.amount/100).toFixed(2)} {r.currency}</td>
                  <td style={{ padding: 8 }}>{new Date(r.created_at).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={()=>approve(r.id, r.amount)}>Approve</button>
                    <button onClick={()=>reject(r.id)} style={{ marginLeft: 8 }}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={()=>setOffset(Math.max(0, offset - limit))} disabled={page<=1}>Prev</button>
        <span style={{ margin: '0 8px' }}>Page {page} / {totalPages}</span>
        <button onClick={()=>setOffset(offset + limit)} disabled={page>=totalPages}>Next</button>
      </div>
    </div>
  );
}
