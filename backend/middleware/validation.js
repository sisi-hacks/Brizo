const { body, param, validationResult } = require('express-validator');
const Joi = require('joi');

// Validation schemas
const paymentSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be greater than 0',
    'any.required': 'Amount is required'
  }),
  description: Joi.string().min(1).max(500).required().messages({
    'string.empty': 'Description cannot be empty',
    'string.max': 'Description must be less than 500 characters',
    'any.required': 'Description is required'
  }),
  merchantId: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Merchant ID cannot be empty',
    'string.max': 'Merchant ID must be less than 100 characters',
    'any.required': 'Merchant ID is required'
  }),
  donation: Joi.boolean().default(false)
});

const paymentIdSchema = Joi.object({
  paymentId: Joi.string().uuid().required().messages({
    'string.guid': 'Payment ID must be a valid UUID',
    'any.required': 'Payment ID is required'
  })
});

const processPaymentSchema = Joi.object({
  sbtcTxId: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'sBTC transaction ID cannot be empty',
    'string.max': 'sBTC transaction ID must be less than 100 characters',
    'any.required': 'sBTC transaction ID is required'
  }),
  walletAddress: Joi.string().pattern(/^ST[1-9A-HJ-NP-Za-km-z]{39}$/).required().messages({
    'string.pattern.base': 'Wallet address must be a valid Stacks address',
    'any.required': 'Wallet address is required'
  })
});

// Validation middleware
const validatePayment = (req, res, next) => {
  const { error } = paymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validatePaymentId = (req, res, next) => {
  const { error } = paymentIdSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateProcessPayment = (req, res, next) => {
  const { error } = processPaymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

// Express-validator middleware for additional validation
const validateCreatePayment = [
  body('amount').isFloat({ min: 0.0001 }).withMessage('Amount must be at least 0.0001 sBTC'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description must be between 1 and 500 characters'),
  body('merchantId').trim().isLength({ min: 1, max: 100 }).withMessage('Merchant ID must be between 1 and 100 characters'),
  body('donation').optional().isBoolean().withMessage('Donation must be a boolean'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(err => err.msg)
      });
    }
    next();
  }
];

const validatePaymentIdParam = [
  param('paymentId').isUUID().withMessage('Payment ID must be a valid UUID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(err => err.msg)
      });
    }
    next();
  }
];

const validateMerchantId = [
  param('merchantId').trim().isLength({ min: 1, max: 100 }).withMessage('Merchant ID must be between 1 and 100 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(err => err.msg)
      });
    }
    next();
  }
];

module.exports = {
  validatePayment,
  validatePaymentId,
  validateProcessPayment,
  validateCreatePayment,
  validatePaymentIdParam,
  validateMerchantId
};
