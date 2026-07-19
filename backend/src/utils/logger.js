import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '../../logs');
const isDev = process.env.NODE_ENV !== 'production';

// ─── Custom Log Levels (add 'http' between warn and verbose) ─────────────────
const levels = {
  error  : 0,
  warn   : 1,
  info   : 2,
  http   : 3,
  verbose: 4,
  debug  : 5,
  silly  : 6,
};

const levelColors = {
  error  : 'red',
  warn   : 'yellow',
  info   : 'green',
  http   : 'magenta',
  verbose: 'cyan',
  debug  : 'blue',
  silly  : 'grey',
};
winston.addColors(levelColors);

// ─── Custom Formats ─────────────────────────────────────────────────────────

const { combine, timestamp, errors, json, colorize, printf, splat, metadata } = winston.format;

/**
 * Colorized, human-readable format for development.
 * Example: [2026-07-18 16:12:41] ERROR: Something went wrong
 *            RequestId: abc123 | GET /api/users | userId: u789
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, timestamp, stack, requestId, method, url, userId, ...rest }) => {
    let line = `[${timestamp}] ${level}: ${message}`;
    const ctx = [
      requestId && `requestId: ${requestId}`,
      method && url && `${method} ${url}`,
      userId  && `userId: ${userId}`,
    ].filter(Boolean).join(' | ');
    if (ctx) line += `\n  → ${ctx}`;
    if (stack) line += `\n${stack}`;
    // Print any remaining extra metadata
    const extras = Object.keys(rest).filter(k => !['service', 'pid'].includes(k));
    if (extras.length) {
      line += `\n  ${extras.map(k => `${k}: ${JSON.stringify(rest[k])}`).join(' | ')}`;
    }
    return line;
  })
);

/**
 * Structured JSON format for production (compatible with Datadog, Logtail, etc.)
 */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  metadata({ fillExcept: ['message', 'level', 'timestamp', 'stack'] }),
  json()
);

// ─── Transports ─────────────────────────────────────────────────────────────

const errorFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',   // Keep 30 days of error logs
  zippedArchive: true,
  format: prodFormat,
});

const combinedFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '20m',
  maxFiles: '14d',   // Keep 14 days of combined logs
  zippedArchive: true,
  format: prodFormat,
});

const consoleTransport = new winston.transports.Console({
  format: isDev ? devFormat : prodFormat,
  // In production, only show warn+ on console to avoid flooding stdout of process managers
  level: isDev ? 'debug' : 'warn',
});

// ─── Logger Instance ─────────────────────────────────────────────────────────

const logger = winston.createLogger({
  levels,
  level: isDev ? 'debug' : 'info',
  defaultMeta: {
    service: 'uniconnect-backend',
    pid: process.pid,
    env: process.env.NODE_ENV || 'development',
  },
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport,
  ],
  // Do NOT exit on handled exceptions — let the app decide
  exitOnError: false,
});

// Emit a startup message so you know the logger is wired correctly
logger.info('Logger initialized', { logDir: LOG_DIR });

export default logger;
