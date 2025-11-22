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

    // Check quota (Premium Standard: 5, Premium Pro: 20, Enterprise: unlimited)
    const memberCount = await prisma.brandMember.count({
      where: { brandId },
    })

    // For now, we'll use a simple check. You can enhance this with subscription tiers
    const maxMembers = 5 // Default for Premium Standard
    if (memberCount >= maxMembers) {
      return NextResponse.json(
        { error: `Đã đạt giới hạn thành viên (${maxMembers}). Vui lòng nâng cấp gói để thêm thành viên.` },
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

