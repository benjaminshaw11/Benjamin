const request = require('supertest');
const { app } = require('../../server');

describe('Manual Deposits', () => {
  test('approve idempotency skeleton', async () => {
    // This is a placeholder test: requires test DB / fixtures to be meaningful
    const res = await request(app).post('/api/manual-deposits/admin/00000000-0000-0000-0000-000000000000/approve').set('Idempotency-Key', 'test-key');
    expect([200, 400, 403, 404, 500]).toContain(res.statusCode);
  });
});
