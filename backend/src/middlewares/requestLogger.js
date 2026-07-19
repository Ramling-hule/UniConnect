import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * Tags each incoming request with a unique requestId.
 * The ID is attached to req, res header, and res.locals so it's
 * available everywhere downstream (controllers, error handler, etc.)
 */
export const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  res.locals.requestId = id;
  next();
};

/**
 * Morgan HTTP access logger piped into Winston.
 * Logs: method, url, status, response time, content length, requestId, userId
 *
 * Skips health-check routes to reduce noise.
 */

// Token: attach requestId to morgan output
morgan.token('request-id', (req) => req.requestId || '-');
morgan.token('user-id',    (req) => req.user?._id?.toString() || '-');

const morganStream = {
  write: (message) => {
    // Morgan appends a newline — trim it before logging
    logger.http(message.trim());
  },
};

const morganFormat =
  ':method :url :status :res[content-length] - :response-time ms | reqId=:request-id userId=:user-id';

export const requestLogger = morgan(morganFormat, {
  stream: morganStream,
  skip: (req) => req.url === '/health' || req.url === '/favicon.ico',
});
