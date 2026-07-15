'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.literal('gen_random_uuid()') },
      entity_type: { type: Sequelize.STRING, allowNull: false },
      entity_id: { type: Sequelize.STRING, allowNull: true },
      action: { type: Sequelize.STRING, allowNull: false },
      actor_id: { type: Sequelize.UUID, allowNull: true },
      data: { type: Sequelize.JSONB, allowNull: true },
      occurred_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      row_hash: { type: Sequelize.STRING, allowNull: true }
    });
    await queryInterface.addIndex('audit_logs', ['entity_type','entity_id'], { name: 'audit_logs_entity_idx' });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audit_logs');
  }
};
