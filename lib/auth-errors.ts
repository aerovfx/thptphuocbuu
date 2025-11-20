/**
 * Authentication error types and handlers
 */

export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PASSWORD_REQUIRED = 'PASSWORD_REQUIRED',
  OAUTH_ONLY = 'OAUTH_ONLY',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
}

export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export function handleAuthError(error: unknown): { message: string; statusCode: number } {
  if (error instanceof AuthError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error) {
    // Handle NextAuth errors
    if (error.message.includes('CredentialsSignin')) {
      return {
        message: 'Email hoặc mật khẩu không đúng',
        statusCode: 401,
      }
    }

    if (error.message.includes('OAuthSignin')) {
      return {
        message: 'Lỗi khi đăng nhập với OAuth. Vui lòng thử lại.',
        statusCode: 500,
      }
    }

    if (error.message.includes('Token đã hết hạn')) {
      return {
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        statusCode: 401,
      }
    }

    if (error.message.includes('Session không hợp lệ')) {
      return {
        message: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
        statusCode: 401,
      }
    }
  }

  return {
    message: 'Đã xảy ra lỗi xác thực. Vui lòng thử lại.',
    statusCode: 500,
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 6) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự')
  }

  if (password.length > 128) {
    errors.push('Mật khẩu không được vượt quá 128 ký tự')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

