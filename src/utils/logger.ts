/**
 * Logger utility for the application
 * In production (__DEV__ = false), logs are suppressed to improve performance
 * and prevent sensitive data exposure
 */

const isDev = __DEV__;

export const logger = {
  /**
   * Log general information (suppressed in production)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log errors (always logged, even in production)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log warnings (suppressed in production)
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log debug information (suppressed in production)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log information (always logged)
   */
  info: (...args: any[]) => {
    console.log('[INFO]', ...args);
  },
};

export default logger;
