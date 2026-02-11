class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

  const successResponse = (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };

const errorResponse = (res, message, statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

module.exports = {
  AppError,
  successResponse,
  errorResponse
};
