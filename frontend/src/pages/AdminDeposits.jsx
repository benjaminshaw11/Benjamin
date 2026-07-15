import React, { useState, useEffect, useMemo, useRef } from 'react';
import { authClient } from '../lib/authClient';
import { useAuth } from '../hooks/useAuth';

// Small, self-contained UI helpers so we don't add deps
function Spinner() {
  return <div style={{ padding: 12 }}>Loading…</div>;
}

function Toasts({ toasts, remove }) {
  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 9999 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.type === 'error' ? '#ffdddd' : '#ddffdd', padding: 10, marginBottom: 8, borderRadius: 6, minWidth: 240 }}>
          <strong>{t.title}</strong>
          <div style={{ fontSize: 13 }}>{t.message}</div>
          <div style={{ textAlign: 'right' }}>
            <button onClick={() => remove(t.id)} style={{ marginTop: 6 }}>Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, maxWidth: 600, width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

export default function AdminDeposits() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [socket, setSocket] = useState(null);

  // UI state
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(1);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // debounce search
  const debouncedQ = useRef(q);
  useEffect(() => {
    const t = setTimeout(() => { debouncedQ.current = q; setOffset(0); fetchPage(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, limit]);

  const addToast = (title, message, type = 'success') => {
    const id = toastId.current++;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 8000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const fetchPage = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/deposits/pending?q=${encodeURIComponent(debouncedQ.current || '')}&limit=${limit}&offset=${offset}`;
      const res = await authClient.apiFetch(url);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
      addToast('Load failed', e.message || 'Failed to load pending deposits', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [offset]);

  useEffect(() => {
    if (!token) return;
    const s = authClient.connectSocket(window.io || require('socket.io-client'));
    s.on('transaction:update', (payload) => {
      if (!payload || !payload.tx_id) return;
      setRows(prev => prev.filter(r => r.id !== payload.tx_id));
      addToast('Transaction updated', `Transaction ${payload.tx_id} updated`, 'success');
    });
    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  const openApprove = (row) => {
    setActiveRow(row);
    setInputValue('');
    setShowApproveModal(true);
  };
  const openReject = (row) => {
    setActiveRow(row);
    setInputValue('');
    setShowRejectModal(true);
  };

  const doApprove = async () => {
    if (!activeRow) return;
    setShowApproveModal(false);
    setLoading(true);
    try {
      const res = await authClient.apiFetch(`/api/manual-deposits/admin/${activeRow.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matched_bank_txn_id: inputValue || null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approve failed');
      setRows(prev => prev.filter(r => r.id !== activeRow.id));
      addToast('Approved', `Transaction ${activeRow.id} approved and wallet credited`);
    } catch (e) {
      console.error(e);
      addToast('Approve failed', e.message || 'Approve failed', 'error');
    } finally {
      setLoading(false);
      setActiveRow(null);
    }
  };

  const doReject = async () => {
    if (!activeRow) return;
    if (!inputValue || inputValue.trim().length < 2) {
      addToast('Reject failed', 'Please provide a reason for rejection', 'error');
      return;
    }
    setShowRejectModal(false);
    setLoading(true);
    try {
      const res = await authClient.apiFetch(`/api/manual-deposits/admin/${activeRow.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: inputValue })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reject failed');
      setRows(prev => prev.filter(r => r.id !== activeRow.id));
      addToast('Rejected', `Transaction ${activeRow.id} rejected`);
    } catch (e) {
      console.error(e);
      addToast('Reject failed', e.message || 'Reject failed', 'error');
    } finally {
      setLoading(false);
      setActiveRow(null);
    }
  };

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fmtAmount = (amount, currency) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'USD') }).format((amount || 0) / 100);
    } catch (e) {
      return `${(amount/100).toFixed(2)} ${currency}`;
    }
  };

  // Simple admin visibility control: if not signed in, prompt to sign in. Server still enforces admin role.
  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Pending Manual Deposits</h2>
        <div>Please sign in as an admin to view this page.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <Toasts toasts={toasts} remove={removeToast} />
      <h2>Pending Manual Deposits</h2>

      <div style={{ marginBottom: 10, display: 'flex', gap: 8 }}>
        <input placeholder="Search txn id or user email" value={q} onChange={e=>setQ(e.target.value)} style={{ flex: 1, padding: 8 }} />
        <button onClick={() => { setOffset(0); fetchPage(); }}>Search</button>
      </div>

      <div>
        {loading ? <Spinner /> : (
          rows.length === 0 ? (
            <div style={{ padding: 20, color: '#666' }}>No pending manual deposits found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Tx ID</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>User</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Provider Txn</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Created</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 8, fontFamily: 'monospace' }}>{r.id}</td>
                    <td style={{ padding: 8 }}>{r.user_email || r.user_id}</td>
                    <td style={{ padding: 8 }}>{r.provider_payment_id}</td>
                    <td style={{ padding: 8 }}>{fmtAmount(r.amount, r.currency)}</td>
                    <td style={{ padding: 8 }}>{new Date(r.created_at).toLocaleString()}</td>
                    <td style={{ padding: 8 }}>
                      <button onClick={()=>openApprove(r)}>Approve</button>
                      <button onClick={()=>openReject(r)} style={{ marginLeft: 8 }}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={()=>setOffset(Math.max(0, offset - limit))} disabled={page<=1}>Prev</button>
        <span style={{ margin: '0 8px' }}>Page {page} / {totalPages}</span>
        <button onClick={()=>setOffset(offset + limit)} disabled={page>=totalPages}>Next</button>
      </div>

      {showApproveModal && (
        <Modal title={`Approve transaction ${activeRow && activeRow.id}`} onClose={() => setShowApproveModal(false)}>
          <div>
            <div style={{ marginBottom: 8 }}>Matched bank transaction id (optional)</div>
            <input value={inputValue} onChange={e=>setInputValue(e.target.value)} style={{ width: '100%', padding: 8 }} />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowApproveModal(false)}>Cancel</button>
              <button onClick={doApprove}>Approve</button>
            </div>
          </div>
        </Modal>
      )}

      {showRejectModal && (
        <Modal title={`Reject transaction ${activeRow && activeRow.id}`} onClose={() => setShowRejectModal(false)}>
          <div>
            <div style={{ marginBottom: 8 }}>Reason for rejection (required)</div>
            <textarea value={inputValue} onChange={e=>setInputValue(e.target.value)} style={{ width: '100%', padding: 8 }} rows={4} />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button onClick={doReject}>Reject</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
