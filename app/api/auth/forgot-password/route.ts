import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email là bắt buộc' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    // Always return success to prevent email enumeration
    // But only create token if user exists
    if (user) {
      // Generate reset token
      const resetToken = randomBytes(32).toString('hex')
      const resetTokenExpires = new Date(Date.now() + 3600000) // 1 hour from now

      // Save reset token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetTokenExpires,
        },
      })

      // In development, log the reset link
      if (process.env.NODE_ENV === 'development') {
        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${resetToken}`
        logger.log('\n🔐 PASSWORD RESET LINK:')
        logger.log('='.repeat(60))
        logger.log(`Email: ${user.email}`)
        logger.log(`Reset URL: ${resetUrl}`)
        logger.log(`Token expires: ${resetTokenExpires.toLocaleString('vi-VN')}`)
        logger.log('='.repeat(60))
        logger.log('')
      }

      // TODO: In production, send email with reset link
      // await sendPasswordResetEmail(user.email, resetToken)
    }

    // Always return success message (security best practice)
    return NextResponse.json({
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.',
    })
  } catch (error: any) {
    logger.error('Forgot password error:', error)
    return NextResponse.json(
      { 
        error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

