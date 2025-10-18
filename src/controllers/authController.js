const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { User, Subscription, Certificate } = require('../models');
const stripeService = require('../services/stripeService');

exports.signup = async (req, res) => {
  try {
    const { email, password, firstname, lastname, phone } = req.body;

    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/).required()
        .messages({
          'string.pattern.base': 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
        }),
      firstname: Joi.string().min(2).max(100).required(),
      lastname: Joi.string().min(2).max(100).required(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
    });

    const { error } = schema.validate({ email, password, firstname, lastname, phone });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const existingUser = await User.findOne({ 
      where: { email: email.toLowerCase() } 
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un compte existe déjà avec cet email'
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email: email.toLowerCase(),
      password_hash,
      firstname,
      lastname,
      phone: phone || null,
      status: 'active',
      email_verified: false
    });

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    const checkoutSession = await stripeService.createCheckoutSession({
      userId: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname
    });

    // CORRECTION ICI : Structure correcte
    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          hasActiveSubscription: false
        },
        accessToken,
        refreshToken,
        checkoutUrl: checkoutSession.url
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [
        { model: Subscription, as: 'subscription', required: false },
        { model: Certificate, as: 'certificate', required: false }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const hasActiveSubscription = user.subscription && 
      user.subscription.status === 'active' &&
      new Date(user.subscription.current_period_end) > new Date();

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    await user.update({ last_login: new Date() });

    const response = {
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          hasActiveSubscription
        },
        accessToken,
        refreshToken
      }
    };

    if (hasActiveSubscription) {
      response.data.user.subscription = {
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.current_period_end,
        planType: user.subscription.plan_type || 'basic',
        cancelAtPeriodEnd: user.subscription.cancel_at_period_end || false
      };
    }

    if (user.certificate && !user.certificate.revoked) {
      response.data.user.certificate = {
        id: user.certificate.id,
        commonName: user.certificate.common_name,
        issuedAt: user.certificate.issued_at,
        expiresAt: user.certificate.expires_at,
        revoked: user.certificate.revoked
      };
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
};

exports.me = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      include: [
        { model: Subscription, as: 'subscription', required: false, where: { status: 'active' } },
        { model: Certificate, as: 'certificate', required: false, where: { revoked: false } }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const hasActiveSubscription = user.subscription && 
      user.subscription.status === 'active' &&
      new Date(user.subscription.current_period_end) > new Date();

    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          phone: user.phone,
          hasActiveSubscription,
          createdAt: user.created_at,
          lastLogin: user.last_login
        }
      }
    };

    if (hasActiveSubscription) {
      response.data.user.subscription = {
        id: user.subscription.id,
        status: user.subscription.status,
        planType: user.subscription.plan_type || 'basic',
        currentPeriodStart: user.subscription.current_period_start,
        currentPeriodEnd: user.subscription.current_period_end,
        cancelAtPeriodEnd: user.subscription.cancel_at_period_end || false,
        stripeCustomerId: user.subscription.stripe_customer_id,
        stripeSubscriptionId: user.subscription.stripe_subscription_id
      };
    }

    if (user.certificate && !user.certificate.revoked) {
      const daysUntilExpiration = Math.ceil(
        (new Date(user.certificate.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
      );

      response.data.user.certificate = {
        id: user.certificate.id,
        commonName: user.certificate.common_name,
        issuedAt: user.certificate.issued_at,
        expiresAt: user.certificate.expires_at,
        revoked: user.certificate.revoked,
        daysUntilExpiration
      };
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Get user info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
};
