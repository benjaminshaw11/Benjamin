'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create wallet_transactions table
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    await queryInterface.createTable('wallet_transactions', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.literal('gen_random_uuid()') },
      user_id: { type: Sequelize.UUID, allowNull: false },
      amount: { type: Sequelize.BIGINT, allowNull: false },
      currency: { type: Sequelize.STRING, allowNull: false, defaultValue: 'INR' },
      type: { type: Sequelize.STRING, allowNull: false }, // credit/debit
      reference_tx: { type: Sequelize.UUID, allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') }
    });
    await queryInterface.addIndex('wallet_transactions', ['user_id'], { name: 'wallet_tx_user_idx' });

    // Ensure users.balance exists (use raw SQL with IF NOT EXISTS)
    await queryInterface.sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS balance BIGINT DEFAULT 0;`);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('wallet_transactions');
    // Note: do not remove users.balance in down to avoid accidental data loss
  }
};
