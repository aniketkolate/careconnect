const authService = require('../services/auth.service');
const jwt = require('jsonwebtoken');

exports.register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({
            message: 'Registration successful',
            userId: user.id,
            role: user.role,
        });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const user = await authService.login(req.body);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            userId: user.id,
            role: user.role,
            token: user.token
        });
    } catch (err) {
        next(err);
    }
};
