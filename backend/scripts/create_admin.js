#!/usr/bin/env node
// scripts/create_admin.js
// Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret node scripts/create_admin.js

const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

(async function() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars');
    process.exit(1);
  }
  const dbUrl = process.env.DATABASE_URL || `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`;
  const sequelize = new Sequelize(dbUrl, { logging: false });
  try {
    await sequelize.authenticate();
    const hash = await bcrypt.hash(password, 12);
    // upsert into users table
    await sequelize.query(`INSERT INTO users (id, email, password_hash, is_admin, created_at) VALUES (gen_random_uuid(), $1, $2, true, now()) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_admin = true`, { bind: [email, hash] });
    console.log('Admin user created/updated:', email);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin', err);
    process.exit(1);
  }
})();
