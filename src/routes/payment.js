const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.post('/create-checkout-session', authenticate, paymentController.createCheckoutSession);

module.exports = router;
