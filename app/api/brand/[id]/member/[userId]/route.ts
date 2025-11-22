import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: brandId, userId: targetUserId } = await params

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

    // Check if user is owner or admin, or if user is removing themselves
    const userMembership = brand.members[0]
    const isSelfRemoval = targetUserId === session.user.id

    if (!isSelfRemoval && (!userMembership || (userMembership.role !== 'OWNER' && userMembership.role !== 'ADMIN'))) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa thành viên này' },
        { status: 403 }
      )
    }

    // Prevent owner from removing themselves
    if (isSelfRemoval) {
      const targetMembership = await prisma.brandMember.findUnique({
        where: {
          brandId_userId: {
            brandId,
            userId: targetUserId,
          },
        },
      })

      if (targetMembership?.role === 'OWNER') {
        return NextResponse.json(
          { error: 'Chủ sở hữu không thể tự xóa khỏi thương hiệu' },
          { status: 400 }
        )
      }
    }

    // Remove badge if exists
    await prisma.brandBadge.deleteMany({
      where: {
        brandId,
        userId: targetUserId,
      },
    })

    // Remove membership
    await prisma.brandMember.delete({
      where: {
        brandId_userId: {
          brandId,
          userId: targetUserId,
        },
      },
    })

    // If user was the owner and removed themselves, update brand's createdById
    // (This shouldn't happen based on check above, but just in case)
    if (isSelfRemoval && userMembership?.role === 'OWNER') {
      // Find another owner or admin to transfer ownership
      const newOwner = await prisma.brandMember.findFirst({
        where: {
          brandId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
        orderBy: { createdAt: 'asc' },
      })

      if (newOwner) {
        await prisma.brandMember.update({
          where: { id: newOwner.id },
          data: { role: 'OWNER' },
        })

        await prisma.brand.update({
          where: { id: brandId },
          data: { createdById: newOwner.userId },
        })
      }
    }

    return NextResponse.json({
      message: 'Đã xóa thành viên khỏi thương hiệu',
    })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa thành viên' },
      { status: 500 }
    )
  }
}

