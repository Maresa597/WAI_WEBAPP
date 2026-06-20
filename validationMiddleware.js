// Request data validation middleware for incoming API requests
import { body, validationResult } from 'express-validator';

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
    });
  }

  next();
}

export const validateRegister = [
  body('full_name').notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().withMessage('Please enter a valid email address.'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email').notEmpty().withMessage('Email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidationErrors,
];

export const validateServiceRequest = [
  body('service_id').notEmpty().withMessage('Service ID is required.'),
  handleValidationErrors,
];

export const validateStatusUpdate = [
  body('status')
    .isIn(['pending', 'approved', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status selected.'),
  handleValidationErrors,
];

export const validateMaintenanceLog = [
  body('system_id').notEmpty().withMessage('System ID is required.'),
  body('service_id').notEmpty().withMessage('Service ID is required.'),
  body('maintenance_date').notEmpty().withMessage('Maintenance date is required.'),
  handleValidationErrors,
];

export const validateNotification = [
  body('user_id').notEmpty().withMessage('User ID is required.'),
  body('system_id').notEmpty().withMessage('System ID is required.'),
  body('title').notEmpty().withMessage('Title is required.'),
  body('message').notEmpty().withMessage('Message is required.'),
  handleValidationErrors,
];
