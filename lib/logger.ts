/**
 * Logger utility for safe logging in production
 * Only logs in development mode to prevent sensitive information leakage
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  error: (...args: any[]) => {
    // Always log errors, but sanitize in production
    if (isDevelopment) {
      console.error(...args)
    } else {
      // In production, only log error messages without sensitive data
      const sanitized = args.map((arg) => {
        if (typeof arg === 'string') {
          // Remove potential sensitive information
          return arg.replace(/password/gi, '[REDACTED]')
            .replace(/token/gi, '[REDACTED]')
            .replace(/secret/gi, '[REDACTED]')
            .replace(/key/gi, '[REDACTED]')
        }
        if (arg instanceof Error) {
          return {
            message: arg.message,
            name: arg.name,
            // Don't log stack trace in production
          }
        }
        return arg
      })
      console.error(...sanitized)
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
}

