import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addMemberSchema = z.object({
  userId: z.string(),
  role: z.string().default('MEMBER'),
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

    const members = await prisma.departmentMember.findMany({
      where: { departmentId: id },
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
      orderBy: [
        { role: 'asc' }, // Leader first
        { joinedAt: 'desc' },
      ],
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching department members:', error)
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
    const department = await prisma.department.findUnique({
      where: { id },
    })

    if (!department) {
      return NextResponse.json({ error: 'Department không tồn tại' }, { status: 404 })
    }

    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'BGH']
    const isLeader = department.leaderId === session.user.id

    if (!allowedRoles.includes(session.user.role) && !isLeader) {
      return NextResponse.json(
        { error: 'Bạn không có quyền thêm thành viên vào department này' },
        { status: 403 }
      )
    }

    // Check if member already exists
    const existing = await prisma.departmentMember.findUnique({
      where: {
        departmentId_userId: {
          departmentId: id,
          userId: validatedData.userId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Người dùng đã là thành viên của department này' },
        { status: 400 }
      )
    }

    const member = await prisma.departmentMember.create({
      data: {
        departmentId: id,
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
    console.error('Error adding department member:', error)
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
    const department = await prisma.department.findUnique({
      where: { id },
    })

    if (!department) {
      return NextResponse.json({ error: 'Department không tồn tại' }, { status: 404 })
    }

    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'BGH']
    const isLeader = department.leaderId === session.user.id

    if (!allowedRoles.includes(session.user.role) && !isLeader) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa thành viên khỏi department này' },
        { status: 403 }
      )
    }

    // Check if member exists
    const member = await prisma.departmentMember.findUnique({
      where: {
        departmentId_userId: {
          departmentId: id,
          userId: userId,
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Thành viên không tồn tại trong department này' },
        { status: 404 }
      )
    }

    // Prevent removing the leader if they are the department leader
    if (member.role === 'LEADER' && department.leaderId === userId) {
      return NextResponse.json(
        { error: 'Không thể xóa trưởng tổ. Vui lòng chỉ định trưởng tổ mới trước.' },
        { status: 400 }
      )
    }

    await prisma.departmentMember.delete({
      where: {
        departmentId_userId: {
          departmentId: id,
          userId: userId,
        },
      },
    })

    return NextResponse.json({ message: 'Đã xóa thành viên thành công' })
  } catch (error) {
    console.error('Error removing department member:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa thành viên' },
      { status: 500 }
    )
  }
}

