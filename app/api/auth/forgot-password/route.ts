import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { logger } from '@/lib/logger'
import { sendPasswordResetEmail } from '@/lib/email'

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

    // Ensure Prisma connection
    try {
      await prisma.$connect()
    } catch (connectError: any) {
      console.error('Prisma connection error:', connectError)
      // Continue anyway, Prisma might already be connected
    }

    // Find user
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          resetPasswordToken: true,
          resetPasswordExpires: true,
        },
      })
    } catch (queryError: any) {
      console.error('Prisma query error:', queryError)
      // If it's a table not found error, provide helpful message
      if (queryError?.message?.includes('does not exist')) {
        throw new Error(`Database table error: ${queryError.message}. Please run: npx prisma db push`)
      }
      throw queryError
    }

    // Always return success to prevent email enumeration
    // But only create token if user exists
    if (user) {
      // Generate reset token
      const resetToken = randomBytes(32).toString('hex')
      const resetTokenExpires = new Date(Date.now() + 900000) // 15 minutes from now

      // Save reset token to database
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetTokenExpires,
          },
        })
      } catch (updateError: any) {
        console.error('Prisma update error:', updateError)
        // If it's a table not found error, provide helpful message
        if (updateError?.message?.includes('does not exist')) {
          throw new Error(`Database table error: ${updateError.message}. Please run: npx prisma db push`)
        }
        throw updateError
      }

      // Send password reset email
      try {
        await sendPasswordResetEmail(user.email, resetToken)
      } catch (emailError) {
        logger.error('Failed to send password reset email:', emailError)
        // Continue anyway - email will be logged in development
      }

      // In development, also log the reset link to console
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
    }

    // Always return success message (security best practice)
    return NextResponse.json({
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.',
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    logger.error('Forgot password error:', error)
    
    // Check if it's a Prisma error about missing table
    if (error?.message?.includes('does not exist')) {
      console.error('Database table missing. Please run: npx prisma db push')
      return NextResponse.json(
        { 
          error: 'Lỗi cấu hình database. Vui lòng liên hệ quản trị viên.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

