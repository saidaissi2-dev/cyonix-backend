const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1'
  });
};

const loginLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  5,
  'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
);

const signupLimiter = createLimiter(
  60 * 60 * 1000, // 1 heure
  10,
  'Trop de comptes créés. Veuillez réessayer plus tard.'
);

const passwordResetLimiter = createLimiter(
  60 * 60 * 1000, // 1 heure
  3,
  'Trop de tentatives de réinitialisation. Veuillez réessayer plus tard.'
);

const apiLimiter = createLimiter(
  1 * 60 * 1000, // 1 minute
  100,
  'Trop de requêtes. Veuillez patienter.'
);

module.exports = {
  loginLimiter,
  signupLimiter,
  passwordResetLimiter,
  apiLimiter
};
