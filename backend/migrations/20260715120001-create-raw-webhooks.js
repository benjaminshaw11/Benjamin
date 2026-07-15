'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    await queryInterface.createTable('raw_webhooks', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.literal('gen_random_uuid()') },
      provider: { type: Sequelize.STRING, allowNull: false },
      event_id: { type: Sequelize.STRING, allowNull: true },
      raw_payload: { type: Sequelize.JSONB, allowNull: false },
      signature_verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      received_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') }
    });
    await queryInterface.addIndex('raw_webhooks', ['provider','event_id'], { unique: true, name: 'raw_webhooks_provider_event_idx' });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('raw_webhooks');
  }
};
