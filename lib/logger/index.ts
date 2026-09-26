import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

/**
 * Cloud-Native Structured JSON Logger (Pino)
 * - Outputs structured JSON in production for log forwarders / Datadog / Better Stack / Loki
 * - Pretty-printed in development for terminal readability
 * - Automatic redaction of sensitive credentials, tokens, and PII
 */
export const logger = pino({
  level: logLevel,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  base: {
    service: 'pcyc-space',
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'token',
      'secret',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SMTP_PASSWORD',
    ],
    remove: true,
  },
  transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

/**
 * Creates a scoped child logger with the domain module name pre-bound.
 * @example
 * const log = createModuleLogger('events:cms');
 * log.info({ eventId: '123' }, 'Event published');
 */
export function createModuleLogger(moduleName: string) {
  return logger.child({ module: moduleName });
}
