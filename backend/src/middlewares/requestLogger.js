import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
export const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  res.locals.requestId = id;
  next();
};
morgan.token('request-id', (req) => req.requestId || '-');
morgan.token('user-id',    (req) => req.user?._id?.toString() || '-');

const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

const morganFormat =
  ':method :url :status :res[content-length] - :response-time ms | reqId=:request-id userId=:user-id';

export const requestLogger = morgan(morganFormat, {
  stream: morganStream,
  skip: (req) => req.url === '/health' || req.url === '/favicon.ico',
});
