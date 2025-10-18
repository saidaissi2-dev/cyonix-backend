const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscription = sequelize.define('Subscription', {
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
  stripe_customer_id: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true
  },
  stripe_subscription_id: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['active', 'cancelled', 'expired', 'pending']]
    }
  },
  plan_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'basic'
  },
  current_period_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  current_period_end: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancel_at_period_end: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'subscriptions',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['stripe_customer_id'] },
    { fields: ['stripe_subscription_id'] }
  ]
});

module.exports = Subscription;