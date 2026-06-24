import winston from "winston";

// Read NODE_ENV directly — never import from env.ts to avoid circular dependencies.
const isDevelopment = (process.env.NODE_ENV ?? "development") !== "production";

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const devFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr =
      Object.keys(meta).length > 0 ? " " + JSON.stringify(meta, null, 2) : "";
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}${metaStr}`
      : `[${timestamp}] ${level}: ${message}${metaStr}`;
  }),
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// ---------------------------------------------------------------------------
// Logger instance
// ---------------------------------------------------------------------------

export const logger = winston.createLogger({
  level: isDevelopment ? "debug" : "info",
  format: isDevelopment ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});

// ---------------------------------------------------------------------------
// Morgan-compatible HTTP logger stream
// ---------------------------------------------------------------------------

export const httpLogger = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};
