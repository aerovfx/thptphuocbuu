import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Helper function to check admin permission
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'BGH')) {
    throw new Error('Unauthorized: Admin access required')
  }
  return session
}

// Helper function to check admin permission (BGH không được xóa user)
async function requireAdminForDelete() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only ADMIN can delete users')
  }
  return session
}

// Helper function to create audit log
async function createAuditLog(
  actorId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  details: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        details: JSON.stringify(details),
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            assignedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: user })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông tin người dùng' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Update user
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['STUDENT', 'TEACHER', 'PARENT', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  metadata: z.string().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    // Pre-process data
    const preprocessedBody: any = { ...body }
    if (body.email) {
      preprocessedBody.email = body.email.trim().toLowerCase()
    }
    if (body.firstName) {
      preprocessedBody.firstName = body.firstName.trim()
    }
    if (body.lastName) {
      preprocessedBody.lastName = body.lastName.trim()
    }

    const validatedData = updateUserSchema.parse(preprocessedBody)

    // Get old user data for audit
    const oldUser = await prisma.user.findUnique({
      where: { id },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    })

    if (!oldUser) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Check email uniqueness if email is being updated
    if (validatedData.email && validatedData.email !== oldUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email đã được sử dụng' },
          { status: 400 }
        )
      }
    }

    // Update user
    const updateData: any = { ...validatedData }
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    })

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      'user.update',
      'user',
      user.id,
      {
        old: oldUser,
        new: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
        },
      },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Cập nhật người dùng thành công',
      user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật người dùng' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete by setting status to SUSPENDED)
// BGH không được xóa user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminForDelete()
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        status: true,
        metadata: true,
        firstName: true,
        lastName: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Prevent deleting yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Bạn không thể xóa chính mình' },
        { status: 400 }
      )
    }

    // Check if user is already suspended (soft deleted)
    if (user.status === 'SUSPENDED') {
      return NextResponse.json({ message: 'Người dùng đã bị tạm dừng trước đó' }, { status: 200 })
    }

    const deletedEmail = `deleted+${id}@thptphuocbuu.local`
    let nextMetadata: any = {}
    try {
      nextMetadata = user.metadata ? JSON.parse(user.metadata) : {}
    } catch {
      nextMetadata = {}
    }
    nextMetadata.deletedAt = new Date().toISOString()
    nextMetadata.deletedBy = session.user.id
    nextMetadata.previousEmail = user.email
    nextMetadata.previousFirstName = user.firstName
    nextMetadata.previousLastName = user.lastName
    nextMetadata.previousAvatar = user.avatar
    nextMetadata.previousCoverPhoto = user.coverPhoto
    nextMetadata.previousBio = user.bio
    nextMetadata.previousPhone = user.phone
    nextMetadata.previousDateOfBirth = user.dateOfBirth ? user.dateOfBirth.toISOString() : null

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.account.deleteMany({ where: { userId: id } }),
      prisma.userRoleAssignment.deleteMany({ where: { userId: id } }),
      prisma.userModuleAccess.deleteMany({ where: { userId: id } }),
      prisma.user.update({
        where: { id },
        data: {
          status: 'SUSPENDED',
          email: deletedEmail,
          password: null,
          emailVerified: null,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
          firstName: 'Đã',
          lastName: 'xóa',
          avatar: null,
          coverPhoto: null,
          bio: null,
          phone: null,
          dateOfBirth: null,
          metadata: JSON.stringify(nextMetadata),
        },
      }),
    ])

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      'user.delete',
      'user',
      user.id,
      { email: user.email },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Xóa người dùng thành công',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa người dùng' },
      { status: 500 }
    )
  }
}

