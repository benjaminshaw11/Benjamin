'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('transactions', 'method', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('transactions', 'provider_payment_id', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('transactions', 'payer_vpa', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('transactions', 'payer_account', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('transactions', 'status', { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending_manual' });
    await queryInterface.addColumn('transactions', 'verified_by', { type: Sequelize.UUID, allowNull: true });
    await queryInterface.addColumn('transactions', 'verified_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('transactions', 'reconciliation_id', { type: Sequelize.UUID, allowNull: true });
    await queryInterface.addIndex('transactions', ['provider_payment_id'], { name: 'transactions_provider_payment_id_idx' });
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex('transactions', 'transactions_provider_payment_id_idx');
    await queryInterface.removeColumn('transactions', 'reconciliation_id');
    await queryInterface.removeColumn('transactions', 'verified_at');
    await queryInterface.removeColumn('transactions', 'verified_by');
    await queryInterface.removeColumn('transactions', 'status');
    await queryInterface.removeColumn('transactions', 'payer_account');
    await queryInterface.removeColumn('transactions', 'payer_vpa');
    await queryInterface.removeColumn('transactions', 'provider_payment_id');
    await queryInterface.removeColumn('transactions', 'method');
  }
};
