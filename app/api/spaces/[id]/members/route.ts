import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addMemberSchema = z.object({
  userId: z.string(),
  role: z.string().default('MEMBER'),
  canRead: z.boolean().default(true),
  canWrite: z.boolean().default(false),
  canManage: z.boolean().default(false),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user has access to this space
    const spaceMember = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: id,
          userId: session.user.id,
        },
      },
    })

    const space = await prisma.space.findUnique({
      where: { id },
    })

    // Allow if user is member, or space is public/internal and user is authenticated
    if (!spaceMember && space && space.visibility === 'PRIVATE') {
      return NextResponse.json(
        { error: 'Bạn không có quyền truy cập space này' },
        { status: 403 }
      )
    }

    const members = await prisma.spaceMember.findMany({
      where: { spaceId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching space members:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách thành viên' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = addMemberSchema.parse(body)

    // Check if user has permission to add members
    const spaceMember = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: id,
          userId: session.user.id,
        },
      },
    })

    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'BGH']
    const canManage = spaceMember?.canManage || allowedRoles.includes(session.user.role)

    if (!canManage) {
      return NextResponse.json(
        { error: 'Bạn không có quyền thêm thành viên vào space này' },
        { status: 403 }
      )
    }

    // Check if member already exists
    const existing = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: id,
          userId: validatedData.userId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Người dùng đã là thành viên của space này' },
        { status: 400 }
      )
    }

    const member = await prisma.spaceMember.create({
      data: {
        spaceId: id,
        userId: validatedData.userId,
        role: validatedData.role,
        canRead: validatedData.canRead,
        canWrite: validatedData.canWrite,
        canManage: validatedData.canManage,
        invitedBy: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error adding space member:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi thêm thành viên' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 })
    }

    // Check if user has permission to remove members
    const spaceMember = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: id,
          userId: session.user.id,
        },
      },
    })

    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'BGH']
    const canManage = spaceMember?.canManage || allowedRoles.includes(session.user.role)

    if (!canManage) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa thành viên khỏi space này' },
        { status: 403 }
      )
    }

    // Check if member exists
    const member = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: id,
          userId: userId,
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Thành viên không tồn tại trong space này' },
        { status: 404 }
      )
    }

    await prisma.spaceMember.delete({
      where: {
        spaceId_userId: {
          spaceId: id,
          userId: userId,
        },
      },
    })

    return NextResponse.json({ message: 'Đã xóa thành viên thành công' })
  } catch (error) {
    console.error('Error removing space member:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa thành viên' },
      { status: 500 }
    )
  }
}

