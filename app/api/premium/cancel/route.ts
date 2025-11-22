import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has premium
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true, ownedBrand: { select: { id: true } } },
    })

    if (!user?.isPremium) {
      return NextResponse.json(
        { error: 'Bạn chưa có tài khoản Premium' },
        { status: 400 }
      )
    }

    // Check if user has an active brand
    if (user.ownedBrand) {
      return NextResponse.json(
        { error: 'Không thể hủy Premium khi đang có thương hiệu. Vui lòng xóa thương hiệu trước.' },
        { status: 400 }
      )
    }

    // Update user to remove premium
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isPremium: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isPremium: true,
      },
    })

    // TODO: Update subscription status in database
    // await prisma.subscription.updateMany({
    //   where: {
    //     userId: session.user.id,
    //     status: 'ACTIVE',
    //   },
    //   data: {
    //     status: 'CANCELLED',
    //   },
    // })

    return NextResponse.json({
      user: updatedUser,
      message: 'Đã hủy tài khoản Premium',
    })
  } catch (error) {
    console.error('Error cancelling premium:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi hủy tài khoản Premium' },
      { status: 500 }
    )
  }
}

