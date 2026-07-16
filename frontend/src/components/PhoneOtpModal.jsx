import React, { useState } from 'react';

export default function PhoneOtpModal({ visible, onClose, prefillPhone }) {
  const [phone, setPhone] = useState(prefillPhone || '');
  const [step, setStep] = useState('send'); // send | verify | done
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!visible) return null;

  async function sendOtp() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/phone/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'send failed');
      setStep('verify');
      setMessage('OTP sent — check your phone');
    } catch (e) {
      setMessage(e.message || 'send error');
    } finally { setLoading(false); }
  }

  async function verifyOtp() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/phone/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': window.localStorage.getItem('auth_token') ? `Bearer ${window.localStorage.getItem('auth_token')}` : '' }, body: JSON.stringify({ phone, code }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'verify failed');
      setStep('done');
      setMessage('Phone verified');
      setTimeout(() => { onClose(); }, 900);
    } catch (e) {
      setMessage(e.message || 'verify error');
    } finally { setLoading(false); }
  }

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 400 }}>
        <h3>Verify phone</h3>
        {message && <div style={{ marginBottom: 8 }}>{message}</div>}
        {step === 'send' && (
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Phone number</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} style={{ width: '100%', padding: 8 }} />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={onClose}>Cancel</button>
              <button onClick={sendOtp} disabled={loading}>Send OTP</button>
            </div>
          </div>
        )}
        {step === 'verify' && (
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Enter OTP</label>
            <input value={code} onChange={e=>setCode(e.target.value)} style={{ width: '100%', padding: 8 }} />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setStep('send')}>Back</button>
              <button onClick={verifyOtp} disabled={loading}>Verify</button>
            </div>
          </div>
        )}
        {step === 'done' && (
          <div>
            <div>Phone verified — thank you</div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
