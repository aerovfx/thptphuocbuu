import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can delete users
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ quản trị viên mới có thể xóa người dùng' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Prevent deleting yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Bạn không thể xóa chính mình' },
        { status: 400 }
      )
    }

    // Check if user exists
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

    // Soft delete: set status to SUSPENDED and revoke sessions/accounts
    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { message: 'Người dùng đã bị tạm dừng trước đó' },
        { status: 200 }
      )
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
          // Break future logins and free up email if needed
          email: deletedEmail,
          password: null,
          emailVerified: null,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
          // Remove PII
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

    // Revalidate pages that display users list
    revalidatePath('/dashboard/users')
    revalidatePath('/dashboard')

    return NextResponse.json(
      { message: 'Đã xóa người dùng thành công' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa người dùng' },
      { status: 500 }
    )
  }
}

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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    return NextResponse.json(user, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông tin người dùng' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can edit users
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ quản trị viên mới có thể chỉnh sửa người dùng' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.role) {
      return NextResponse.json(
        { error: 'Họ, tên và vai trò là bắt buộc' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        phone: body.phone || null,
        bio: body.bio || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Revalidate pages
    revalidatePath('/dashboard/users')
    revalidatePath(`/users/${id}`)

    return NextResponse.json(
      { message: 'Đã cập nhật người dùng thành công', user: updatedUser },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật người dùng', details: error.message },
      { status: 500 }
    )
  }
}

