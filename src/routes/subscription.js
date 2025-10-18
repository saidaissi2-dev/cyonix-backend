const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');

router.get('/info', authenticate, subscriptionController.getInfo);
router.post('/cancel', authenticate, subscriptionController.cancel);
router.post('/reactivate', authenticate, subscriptionController.reactivate);
router.get('/invoices', authenticate, subscriptionController.getInvoices);

module.exports = router;
