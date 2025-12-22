/**
 * Email service utility
 * In development, logs emails to console
 * In production, integrates with email service (SendGrid, AWS SES, etc.)
 */

import { logger } from './logger'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (process.env.NODE_ENV === 'development') {
      // In development, log email to console
      logger.log('\n📧 EMAIL SENT:')
      logger.log('='.repeat(60))
      logger.log(`To: ${options.to}`)
      logger.log(`Subject: ${options.subject}`)
      logger.log(`Body:\n${options.text || options.html}`)
      logger.log('='.repeat(60))
      logger.log('')
      return true
    }

    // In production, use actual email service
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    if (process.env.EMAIL_SERVICE === 'sendgrid') {
      // await sendWithSendGrid(options)
    } else if (process.env.EMAIL_SERVICE === 'ses') {
      // await sendWithSES(options)
    } else {
      // Fallback: log in production if no service configured
      logger.warn('Email service not configured. Email would be sent to:', options.to)
      logger.warn('Subject:', options.subject)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error sending email:', error)
    return false
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email/${token}`
  
  return sendEmail({
    to: email,
    subject: 'Xác nhận email đăng ký',
    html: `
      <h2>Xác nhận email đăng ký</h2>
      <p>Cảm ơn bạn đã đăng ký tài khoản!</p>
      <p>Vui lòng click vào link sau để xác nhận email của bạn:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>Link này sẽ hết hạn sau 24 giờ.</p>
      <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
    `,
    text: `
Xác nhận email đăng ký

Cảm ơn bạn đã đăng ký tài khoản!

Vui lòng click vào link sau để xác nhận email của bạn:
${verificationUrl}

Link này sẽ hết hạn sau 24 giờ.

Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${token}`
  
  return sendEmail({
    to: email,
    subject: 'Đặt lại mật khẩu',
    html: `
      <h2>Đặt lại mật khẩu</h2>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
      <p>Vui lòng click vào link sau để đặt lại mật khẩu:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Link này sẽ hết hạn sau 15 phút.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
    `,
    text: `
Đặt lại mật khẩu

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.

Vui lòng click vào link sau để đặt lại mật khẩu:
${resetUrl}

Link này sẽ hết hạn sau 15 phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
    `,
  })
}

export async function sendAccountLockoutEmail(email: string, lockedUntil: Date): Promise<boolean> {
  const minutesRemaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
  
  return sendEmail({
    to: email,
    subject: 'Cảnh báo: Tài khoản của bạn đã bị khóa',
    html: `
      <h2>Cảnh báo: Tài khoản của bạn đã bị khóa</h2>
      <p>Tài khoản của bạn đã bị khóa tạm thời do đăng nhập sai mật khẩu quá nhiều lần.</p>
      <p>Tài khoản sẽ được mở khóa sau ${minutesRemaining} phút.</p>
      <p>Nếu bạn không thực hiện các lần đăng nhập này, vui lòng liên hệ quản trị viên ngay lập tức.</p>
    `,
    text: `
Cảnh báo: Tài khoản của bạn đã bị khóa

Tài khoản của bạn đã bị khóa tạm thời do đăng nhập sai mật khẩu quá nhiều lần.

Tài khoản sẽ được mở khóa sau ${minutesRemaining} phút.

Nếu bạn không thực hiện các lần đăng nhập này, vui lòng liên hệ quản trị viên ngay lập tức.
    `,
  })
}

