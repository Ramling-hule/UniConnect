import logger from '../utils/logger.js';
import { env } from '../config/env.js';

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode || 500;
  // Fallback if status was incorrectly left at 200
  if (statusCode === 200) statusCode = 500;

  // ─── Shared context for all log entries ────────────────────────────────────
  const logContext = {
    requestId : req.requestId || res.locals?.requestId,
    method    : req.method,
    url       : req.originalUrl,
    statusCode,
    userId    : req.user?._id?.toString(),
    ip        : req.ip,
    userAgent : req.headers['user-agent'],
  };

  // ─── Log level strategy ─────────────────────────────────────────────────────
  // 5xx → error  (real bugs, needs immediate attention)
  // 4xx → warn   (client mistakes, not your bug — reduce alert fatigue)
  // Operational errors (AppError) get lighter treatment
  if (statusCode >= 500) {
    logger.error(err.message, {
      ...logContext,
      stack: err.stack,
      isOperational: err.isOperational ?? false,
    });
  } else if (statusCode >= 400) {
    logger.warn(err.message, logContext);
  }

  // ─── API response ────────────────────────────────────────────────────────────
  const response = {
    success   : false,
    status    : err.status || 'error',
    message   : err.message || 'Internal Server Error',
    requestId : logContext.requestId, // Let clients reference this in support tickets
  };

  // Include stack trace only in development
  if (env.nodeEnv !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
