import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 400 }
      )
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token, // Using resetPasswordToken field for verification token
        resetPasswordExpires: {
          gt: new Date(), // Token not expired
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Token không hợp lệ hoặc đã hết hạn' },
        { status: 400 }
      )
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    })

    return NextResponse.json(
      { message: 'Email đã được xác nhận thành công' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xác nhận email' },
      { status: 500 }
    )
  }
}

