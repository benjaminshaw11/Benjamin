Payments architecture (Razorpay + UPI/Bank flows)

Overview
- Provider: Razorpay (supports UPI QR, UPI collect, payment links, card, netbanking).
- Flow:
  1. Client requests a deposit.
  2. Server creates a provider order / payment link using RAZORPAY_KEY_ID / SECRET.
  3. Provider returns a payment link / UPI QR JSON to the client.
  4. User completes payment in UPI app; provider posts webhook to /api/webhooks/razorpay.
  5. Server verifies signature, stores raw webhook, upserts transactions, writes audit log.
  6. Daily reconciliation compares provider settlement/payout reports with transactions.

Operational notes
- Ensure RAZORPAY_WEBHOOK_SECRET is configured and webhooks point to https://<your-domain>/api/webhooks/razorpay
