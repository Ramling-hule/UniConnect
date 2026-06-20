import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests from this IP. Please try again after a minute.',
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many registration requests from this IP. Please try again in an hour.',
  },
});
