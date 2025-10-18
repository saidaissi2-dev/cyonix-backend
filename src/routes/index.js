const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');

const authController = require('../controllers/authController');
const certificateController = require('../controllers/certificateController');
const webhookController = require('../controllers/webhookController');
const subscriptionController = require('../controllers/subscriptionController');
const paymentController = require('../controllers/paymentController');

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      stripe: 'operational',
      pki: 'reachable'
    }
  });
});

router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authMiddleware, authController.me);

// Webhook Stripe (raw body required)
router.post('/webhooks/stripe', webhookController.handleStripeWebhook);

router.get('/certificates/info', authMiddleware, certificateController.getCertificateInfo);
router.get('/certificates/download', authMiddleware, certificateController.downloadCertificate);
router.delete('/certificates/revoke', authMiddleware, certificateController.revokeCertificate);

// Subscription routes - NOMS CORRECTS
router.get('/subscription/info', authMiddleware, subscriptionController.getInfo);
router.post('/subscription/cancel', authMiddleware, subscriptionController.cancel);
router.post('/subscription/reactivate', authMiddleware, subscriptionController.reactivate);
router.get('/subscription/invoices', authMiddleware, subscriptionController.getInvoices);

// Payment routes
router.post('/payment/create-checkout-session', authMiddleware, paymentController.createCheckoutSession);
router.post('/subscription/checkout', authMiddleware, paymentController.createCheckoutSession);

module.exports = router;
