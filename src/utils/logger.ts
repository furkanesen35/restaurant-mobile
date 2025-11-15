/**
 * Logger utility for the application
 * Log output is controlled via EXPO_PUBLIC_LOG_LEVEL (debug|info|warn|error|silent)
 * and falls back to `debug` in development / `warn` in production.
 */

type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

const LEVELS: LogLevel[] = ["silent", "error", "warn", "info", "debug"];

const parseLevel = (value?: string | null): LogLevel | null => {
  if (!value) return null;
  const normalized = value.toLowerCase() as LogLevel;
  return LEVELS.includes(normalized) ? normalized : null;
};

const resolvedLevel =
  parseLevel(process.env.EXPO_PUBLIC_LOG_LEVEL) ?? (__DEV__ ? "debug" : "warn");

const shouldLog = (level: LogLevel) =>
  LEVELS.indexOf(level) <= LEVELS.indexOf(resolvedLevel);

export const logger = {
  /**
   * Log general information (defaults to warn+ in production)
   */
  log: (...args: any[]) => {
    if (shouldLog("info")) {
      console.log(...args);
    }
  },

  /**
   * Log errors (suppressed only when LOG_LEVEL=silent)
   */
  error: (...args: any[]) => {
    if (shouldLog("error")) {
      console.error(...args);
    }
  },

  /**
   * Log warnings (hidden unless LOG_LEVEL allows warn+)
   */
  warn: (...args: any[]) => {
    if (shouldLog("warn")) {
      console.warn(...args);
    }
  },

  /**
   * Log debug information
   */
  debug: (...args: any[]) => {
    if (shouldLog("debug")) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Log information with explicit prefix
   */
  info: (...args: any[]) => {
    if (shouldLog("info")) {
      console.info('[INFO]', ...args);
    }
  },
};

export default logger;
