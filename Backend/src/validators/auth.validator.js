const { body } = require('express-validator');
const { ROLES } = require('../utils/constants');

exports.registerValidator = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 chars'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('role')
        .isIn([ROLES.CARE_SEEKER, ROLES.CARE_TAKER, ROLES.ADMIN])
        .withMessage('Invalid role')
];

exports.loginValidator = [
    body('email').isEmail(),
    body('password').notEmpty()
];
