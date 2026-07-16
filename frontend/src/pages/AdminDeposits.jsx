@@
   const [socket, setSocket] = useState(null);
+  const [showPhoneModal, setShowPhoneModal] = useState(false);
@@
   return (
     <div style={{ padding: 20 }}>
+      <button style={{ position: 'absolute', right: 20, top: 20 }} onClick={() => setShowPhoneModal(true)}>Verify phone</button>
+      <PhoneOtpModal visible={showPhoneModal} onClose={() => setShowPhoneModal(false)} prefillPhone={/* optional: pass phone from user context */ ''} />
       <Toasts toasts={toasts} remove={removeToast} />
       <h2>Pending Manual Deposits</h2>
@@
 export default function AdminDeposits() {
@@
 }
