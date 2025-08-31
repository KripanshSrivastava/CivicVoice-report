import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation error handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array()
    });
    return;
  }
  
  next();
};

// Issue validation rules
export const validateCreateIssue = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .isIn(['Infrastructure', 'Environment', 'Safety', 'Transportation', 'Utilities', 'Public Services', 'Other'])
    .withMessage('Invalid category'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  
  body('location_description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location description must be less than 500 characters'),
  
  body('location_coordinates.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location_coordinates.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
];

export const validateUpdateIssue = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .optional()
    .isIn(['Infrastructure', 'Environment', 'Safety', 'Transportation', 'Utilities', 'Public Services', 'Other'])
    .withMessage('Invalid category'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'resolved', 'rejected'])
    .withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
];

// Comment validation rules
export const validateCreateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters'),
];

// User profile validation rules
export const validateUpdateProfile = [
  body('display_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid phone number format'),
];
