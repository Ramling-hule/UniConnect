import { env } from '../config/env.js';

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  if (statusCode === 200) statusCode = 500; // Fallback if status code was incorrectly left at 200

  const response = {
    success: false,
    status: err.status || 'error',
    message: err.message || 'Internal Server Error',
  };

  // Include stack trace only in development
  if (env.nodeEnv !== 'production') {
    response.stack = err.stack;
  }

  // Log error for server diagnostics
  if (statusCode >= 500) {
    console.error(`[ERROR] ${err.message}`, err.stack);
  }

  res.status(statusCode).json(response);
};
