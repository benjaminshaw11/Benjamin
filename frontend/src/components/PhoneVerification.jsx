import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { authAPIExt } from '../services/api_ext';

export default function PhoneVerification({ token }) {
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const send = async () => {
    await authAPIExt.sendOtp();
    setSent(true);
  };
  const verify = async () => {
    await authAPIExt.verifyOtp(code);
    alert('Phone verified');
  };
  return (
    <div>
      {!sent ? (
        <div>
          <button onClick={send}>Send OTP</button>
        </div>
      ) : (
        <div>
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Enter OTP" />
          <button onClick={verify}>Verify</button>
        </div>
      )}
    </div>
  );
}
