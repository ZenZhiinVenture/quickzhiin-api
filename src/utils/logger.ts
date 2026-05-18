import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  return `${timestamp} [${level}]: ${stack || message} ${
    Object.keys(metadata).length ? JSON.stringify(metadata) : ''
  }`;
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'quickzhiin-api' },
  transports: [
    // Daily Rotate File for errors
    new winston.transports.DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
    // Daily Rotate File for all logs
    new winston.transports.DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// If we're not in production, also log to the console with colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      ),
    })
  );
}

export default logger;
