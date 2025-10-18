const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING
  },
  last_login: {
    type: DataTypes.DATE
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true, // CRITIQUE: Utiliser snake_case
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Static method to hash password
User.hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// Instance method to compare password
User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

// Instance method to return safe object (without password)
User.prototype.toSafeObject = function() {
  const { password_hash, ...safeUser } = this.toJSON();
  return safeUser;
};

module.exports = User;
