// src/middlewares/error.middleware.js

module.exports = (err, req, res, next) => {
    console.error('ERROR:', err);

    // Default values
    const statusCode = err.status || err.statusCode || 500;
    const message =
        err.message ||
        'Internal Server Error';

    // Validation errors (optional support)
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // PostgreSQL errors (unique violation, not null, etc.)
    if (err.code) {
        return res.status(400).json({
            success: false,
            message: err.detail || err.message
        });
    }

    return res.status(statusCode).json({
        success: false,
        message
    });
};
