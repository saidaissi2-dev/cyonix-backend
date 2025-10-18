const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const validators = require('../utils/validators');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

router.post('/submit', validate(validators.contact), async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    await emailService.sendContactNotification({ name, email, subject, message });
    await emailService.sendContactConfirmation({ email, name });
    logger.info(`Contact form submitted by: ${email}`);
    res.json({ success: true, message: 'Message envoyé avec succès' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
