const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const { app } = require('../server');
const { sequelize } = require('../src/models');
const { signAccessToken } = require('../src/lib/tokenService');

jest.setTimeout(30000);

describe('Admin manual deposits flow', () => {
  let adminId;
  let userId;

  beforeAll(async () => {
    await sequelize.authenticate();

    // create admin user
    adminId = uuidv4();
    const adminEmail = `test-admin+${Date.now()}@example.com`;
    const hash = await bcrypt.hash('password123', 10);
    await sequelize.query(`INSERT INTO users (id, email, password_hash, is_admin, created_at)
                           VALUES ($1, $2, $3, true, now())
                           ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`, {
      bind: [adminId, adminEmail, hash]
    });

    // create normal user
    userId = uuidv4();
    const userEmail = `test-user+${Date.now()}@example.com`;
    await sequelize.query(`INSERT INTO users (id, email, created_at)
                           VALUES ($1, $2, now())
                           ON CONFLICT (email) DO NOTHING`, { bind: [userId, userEmail] });
  });

  afterAll(async () => {
    // cleanup test users and any test transactions created
    try {
      await sequelize.query(`DELETE FROM transactions WHERE provider_payment_id LIKE 'TEST-PAY-%'`);
      await sequelize.query(`DELETE FROM users WHERE email ILIKE 'test-%@example.com'`);
    } catch (e) {
      // ignore
    }
    await sequelize.close();
  });

  test('approve changes transaction status to confirmed', async () => {
    const txId = uuidv4();
    const providerId = `TEST-PAY-${Date.now()}`;
    // create pending manual transaction
    await sequelize.query(`INSERT INTO transactions (id, user_id, provider_payment_id, amount, currency, status, created_at)
                           VALUES ($1, $2, $3, $4, $5, 'pending_manual', now())`, {
      bind: [txId, userId, providerId, 10000, 'INR']
    });

    const token = signAccessToken({ userId: adminId, isAdmin: true });

    // approve
    const res = await request(app)
      .post(`/api/manual-deposits/admin/${txId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ matched_bank_txn_id: 'BANK-TEST-123' })
      .expect(200);

    // confirm DB updated
    const [rows] = await sequelize.query('SELECT status FROM transactions WHERE id = $1', { bind: [txId] });
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe('confirmed');
  });

  test('approve is idempotent (double approve remains confirmed)', async () => {
    const txId = uuidv4();
    const providerId = `TEST-PAY-${Date.now()}-2`;
    await sequelize.query(`INSERT INTO transactions (id, user_id, provider_payment_id, amount, currency, status, created_at)
                           VALUES ($1, $2, $3, $4, $5, 'pending_manual', now())`, {
      bind: [txId, userId, providerId, 5000, 'INR']
    });
    const token = signAccessToken({ userId: adminId, isAdmin: true });

    await request(app)
      .post(`/api/manual-deposits/admin/${txId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ matched_bank_txn_id: 'BANK-TEST-456' })
      .expect(200);

    // second call should also succeed and not change status
    await request(app)
      .post(`/api/manual-deposits/admin/${txId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ matched_bank_txn_id: 'BANK-TEST-456' })
      .expect(200);

    const [rows] = await sequelize.query('SELECT status FROM transactions WHERE id = $1', { bind: [txId] });
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe('confirmed');
  });

  test('reject changes transaction status to rejected', async () => {
    const txId = uuidv4();
    const providerId = `TEST-PAY-${Date.now()}-3`;
    await sequelize.query(`INSERT INTO transactions (id, user_id, provider_payment_id, amount, currency, status, created_at)
                           VALUES ($1, $2, $3, $4, $5, 'pending_manual', now())`, {
      bind: [txId, userId, providerId, 7500, 'INR']
    });
    const token = signAccessToken({ userId: adminId, isAdmin: true });

    await request(app)
      .post(`/api/manual-deposits/admin/${txId}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'No matching bank txn' })
      .expect(200);

    const [rows] = await sequelize.query('SELECT status FROM transactions WHERE id = $1', { bind: [txId] });
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe('rejected');
  });
});
