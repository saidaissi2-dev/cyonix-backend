const { Sequelize } = require('sequelize');
require('dotenv').config();

// Créer l'instance Sequelize avec la DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test de connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connexion établie');
  } catch (error) {
    console.error('❌ Impossible de se connecter à PostgreSQL:', error.message);
  }
};

testConnection();

module.exports = { sequelize };
