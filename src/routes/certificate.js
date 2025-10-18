const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticate, requireActiveSubscription } = require('../middleware/auth');

router.get('/download', authenticate, requireActiveSubscription, certificateController.download);
router.get('/info', authenticate, certificateController.getInfo);
router.delete('/revoke', authenticate, certificateController.revoke);
router.post('/regenerate', authenticate, certificateController.regenerate);

module.exports = router;
