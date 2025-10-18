const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Certificate = sequelize.define('Certificate', {
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
  subscription_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'subscriptions',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  common_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  p12_password: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  certificate_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  serial_number: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true
  },
  issued_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  revoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'certificates',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['subscription_id'] },
    { fields: ['common_name'] },
    { fields: ['serial_number'] }
  ]
});

// Instance methods
Certificate.prototype.isExpired = function() {
  if (!this.expires_at) return false;
  return new Date() > this.expires_at;
};

Certificate.prototype.daysUntilExpiration = function() {
  if (!this.expires_at) return null;
  const now = new Date();
  const diff = this.expires_at - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

module.exports = Certificate;