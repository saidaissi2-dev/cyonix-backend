const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const pkiService = require('../services/pkiService');
const emailService = require('../services/emailService');

router.get('/', async (req, res) => {
  try {
    await sequelize.authenticate();
    const dbStatus = 'connected';

    let pkiStatus = 'unknown';
    try {
      const isPKIReachable = await Promise.race([
        pkiService.checkConnection(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      pkiStatus = isPKIReachable ? 'reachable' : 'unreachable';
    } catch {
      pkiStatus = 'unreachable';
    }

    let emailStatus = 'unknown';
    try {
      const isEmailOk = await Promise.race([
        emailService.verifyConnection(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      emailStatus = isEmailOk ? 'operational' : 'error';
    } catch {
      emailStatus = 'error';
    }

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: { database: dbStatus, pki: pkiStatus, email: emailStatus, stripe: 'operational' }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
