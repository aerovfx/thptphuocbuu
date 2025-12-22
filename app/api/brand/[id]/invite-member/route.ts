import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const inviteMemberSchema = z.object({
  userId: z.string().min(1, 'User ID là bắt buộc'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
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
    const validatedData = inviteMemberSchema.parse(body)

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

    // Check if user is owner or admin of the brand
    const userMembership = brand.members[0]
    if (!userMembership || (userMembership.role !== 'OWNER' && userMembership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Bạn không có quyền mời thành viên' },
        { status: 403 }
      )
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Người dùng không tồn tại' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.brandMember.findUnique({
      where: {
        brandId_userId: {
          brandId,
          userId: validatedData.userId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'Người dùng đã là thành viên của thương hiệu này' },
        { status: 400 }
      )
    }

    // Check quota (Premium Standard: 5 linked accounts)
    // Interpreting "tối đa 5 tài khoản liên kết" as 5 members *excluding* the OWNER.
    const linkedCount = await prisma.brandMember.count({
      where: { brandId, role: { not: 'OWNER' } },
    })

    const maxLinkedAccounts = 5
    if (linkedCount >= maxLinkedAccounts) {
      return NextResponse.json(
        { error: `Đã đạt giới hạn tài khoản liên kết (${maxLinkedAccounts}).` },
        { status: 400 }
      )
    }

    // Create membership
    const membership = await prisma.brandMember.create({
      data: {
        brandId,
        userId: validatedData.userId,
        role: validatedData.role,
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

    // If brand is verified, auto-assign default badge to the invited member (if not already present)
    // This keeps the verified badge consistent across linked accounts.
    try {
      if (brand.verificationStatus === 'APPROVED') {
        await prisma.brandBadge.upsert({
          where: {
            brandId_userId: {
              brandId,
              userId: validatedData.userId,
            },
          },
          create: {
            brandId,
            userId: validatedData.userId,
            badgeType: 'GOLD',
            isActive: true,
          },
          update: {
            isActive: true,
          },
        })
      }
    } catch (e) {
      // Non-fatal; membership created successfully.
      console.error('Error auto-assigning badge for invited member:', e)
    }

    return NextResponse.json({
      membership,
      message: 'Đã mời thành viên thành công',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error inviting member:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi mời thành viên' },
      { status: 500 }
    )
  }
}

