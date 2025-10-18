const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'password_reset_tokens',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['token'] }
  ]
});

// Instance methods
PasswordResetToken.prototype.isExpired = function() {
  return new Date() > this.expires_at;
};

PasswordResetToken.prototype.isValid = function() {
  return !this.used && !this.isExpired();
};

module.exports = PasswordResetToken;