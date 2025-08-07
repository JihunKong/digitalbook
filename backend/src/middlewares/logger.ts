import expressWinston from 'express-winston';
import winston from 'winston';

export const requestLogger = expressWinston.logger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json()
  ),
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: true,
  ignoreRoute: function (req, res) {
    return req.url === '/health' || req.url === '/ready';
  },
});