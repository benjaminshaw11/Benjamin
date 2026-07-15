'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'password_hash', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addIndex('users', ['email'], { name: 'users_email_idx' });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', 'users_email_idx');
    await queryInterface.removeColumn('users', 'password_hash');
  }
};
