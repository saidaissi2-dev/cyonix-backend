const User = require('./User');
const Subscription = require('./Subscription');
const Certificate = require('./Certificate');
const PasswordResetToken = require('./PasswordResetToken');
const Session = require('./Session');

// User - Subscription (One-to-One)
User.hasOne(Subscription, {
  foreignKey: 'user_id',
  as: 'subscription'
});
Subscription.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User - Certificate (One-to-One)
User.hasOne(Certificate, {
  foreignKey: 'user_id',
  as: 'certificate'
});
Certificate.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Subscription - Certificate (One-to-One)
Subscription.hasOne(Certificate, {
  foreignKey: 'subscription_id',
  as: 'certificate'
});
Certificate.belongsTo(Subscription, {
  foreignKey: 'subscription_id',
  as: 'subscription'
});

// User - PasswordResetToken (One-to-Many)
User.hasMany(PasswordResetToken, {
  foreignKey: 'user_id',
  as: 'passwordResetTokens'
});
PasswordResetToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User - Session (One-to-Many)
User.hasMany(Session, {
  foreignKey: 'user_id',
  as: 'sessions'
});
Session.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

module.exports = {
  User,
  Subscription,
  Certificate,
  PasswordResetToken,
  Session
};