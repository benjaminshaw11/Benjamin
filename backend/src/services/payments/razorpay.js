const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayAdapter {
  constructor() {
    this.key_id = process.env.RAZORPAY_KEY_ID || '';
    this.key_secret = process.env.RAZORPAY_KEY_SECRET || '';
    if (this.key_id && this.key_secret) {
      this.client = new Razorpay({ key_id: this.key_id, key_secret: this.key_secret });
    } else {
      this.client = null;
    }
  }

  // Create an order (for Checkout flow)
  // amount: in smallest currency unit (paise)
  // receipt: your internal reference (Transaction.reference)
  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    if (!this.client) throw new Error('Razorpay client not configured');
    return this.client.orders.create({ amount, currency, receipt, notes });
  }

  // Create a payment link (alternative to Checkout)
  async createPaymentLink({ amount, currency = 'INR', description, customer = {} }) {
    if (!this.client) throw new Error('Razorpay client not configured');
    return this.client.paymentLink.create({ amount, currency, description, customer });
  }

  // Verify webhook signature. rawBody must be Buffer or string.
  verifyWebhookSignature(rawBody, signature, webhookSecret) {
    try {
      const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      return expected === signature;
    } catch (e) {
      return false;
    }
  }
}

module.exports = new RazorpayAdapter();
