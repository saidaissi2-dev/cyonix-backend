const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Stripe webhook - needs raw body
router.post('/stripe', paymentController.handleWebhook.bind(paymentController));

module.exports = router;