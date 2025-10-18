require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Subscription, Certificate, PasswordResetToken, Session } = require('../models');

async function initDatabase() {
  try {
    console.log('🔌 Connexion à la base de données...');
    console.log(`📍 DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
    
    await sequelize.authenticate();
    console.log('✅ Connexion établie avec succès !');

    console.log('\n📋 Suppression et recréation des tables (FORCE MODE)...');
    
    // Force sync will DROP and recreate ALL tables
    await sequelize.sync({ force: true, logging: console.log });
    
    console.log('\n✅ Tables créées avec succès !');
    console.log('\n📊 Tables créées :');
    console.log('  - users');
    console.log('  - subscriptions');
    console.log('  - certificates');
    console.log('  - password_reset_tokens');
    console.log('  - sessions');
    
    console.log('\n✨ Base de données initialisée !');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation :', error);
    await sequelize.close();
    process.exit(1);
  }
}

initDatabase();
