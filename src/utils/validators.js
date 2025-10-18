const Joi = require('joi');

// Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
const passwordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
  .required()
  .messages({
    'string.pattern.base': 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
  });

const validators = {
  // Auth validators
  signup: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email invalide',
      'any.required': 'Email requis'
    }),
    password: passwordSchema,
    firstname: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Prénom trop court',
      'any.required': 'Prénom requis'
    }),
    lastname: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nom trop court',
      'any.required': 'Nom requis'
    }),
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional().messages({
      'string.pattern.base': 'Numéro de téléphone invalide'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: passwordSchema
  }),

  passwordResetRequest: Joi.object({
    email: Joi.string().email().required()
  }),

  passwordResetConfirm: Joi.object({
    token: Joi.string().required(),
    newPassword: passwordSchema
  }),

  // User validators
  updateProfile: Joi.object({
    firstname: Joi.string().min(2).max(100).optional(),
    lastname: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional()
  }),

  // Contact validator
  contact: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    subject: Joi.string().min(5).max(200).required(),
    message: Joi.string().min(10).max(2000).required()
  })
};

module.exports = validators;