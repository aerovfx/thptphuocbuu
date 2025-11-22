import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignBadgeSchema = z.object({
  userId: z.string().min(1, 'User ID là bắt buộc'),
  badgeType: z.enum(['GOLD', 'SILVER', 'BLUE']),
  badgeIconUrl: z.string().url().optional().or(z.literal('')),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: brandId } = await params
    const body = await request.json()
    const validatedData = assignBadgeSchema.parse(body)

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        members: {
          where: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!brand) {
      return NextResponse.json({ error: 'Thương hiệu không tồn tại' }, { status: 404 })
    }

    // Check if brand is verified
    if (brand.verificationStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Thương hiệu chưa được xác minh. Không thể gán badge.' },
        { status: 403 }
      )
    }

    // Check if user is owner or admin of the brand
    const userMembership = brand.members[0]
    if (!userMembership || (userMembership.role !== 'OWNER' && userMembership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Bạn không có quyền gán badge' },
        { status: 403 }
      )
    }

    // Check if target user is a member of the brand
    const targetMembership = await prisma.brandMember.findUnique({
      where: {
        brandId_userId: {
          brandId,
          userId: validatedData.userId,
        },
      },
    })

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'Người dùng không phải là thành viên của thương hiệu này' },
        { status: 400 }
      )
    }

    // Create or update badge
    const badge = await prisma.brandBadge.upsert({
      where: {
        brandId_userId: {
          brandId,
          userId: validatedData.userId,
        },
      },
      create: {
        brandId,
        userId: validatedData.userId,
        badgeType: validatedData.badgeType,
        badgeIconUrl: validatedData.badgeIconUrl || null,
        isActive: true,
      },
      update: {
        badgeType: validatedData.badgeType,
        badgeIconUrl: validatedData.badgeIconUrl || null,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      badge,
      message: 'Đã gán badge thành công',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error assigning badge:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi gán badge' },
      { status: 500 }
    )
  }
}

