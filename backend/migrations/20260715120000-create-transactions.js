'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    await queryInterface.createTable('transactions', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.literal('gen_random_uuid()') },
      user_id: { type: Sequelize.UUID, allowNull: true },
      provider: { type: Sequelize.STRING, allowNull: false },
      provider_payment_id: { type: Sequelize.STRING, allowNull: true },
      amount: { type: Sequelize.BIGINT, allowNull: false },
      currency: { type: Sequelize.STRING, allowNull: false, defaultValue: 'INR' },
      type: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false },
      idempotency_key: { type: Sequelize.STRING, allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true },
      reconciled_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') }
    });
    await queryInterface.addIndex('transactions', ['provider', 'provider_payment_id'], { unique: true, name: 'transactions_provider_payment_idx' });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transactions');
  }
};
