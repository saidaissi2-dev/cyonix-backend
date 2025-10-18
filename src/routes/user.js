const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const validators = require('../utils/validators');

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, validate(validators.updateProfile), userController.updateProfile);
router.delete('/account', authenticate, userController.deleteAccount);

module.exports = router;
