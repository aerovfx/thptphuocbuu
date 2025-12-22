import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function createAuditLog(params: {
  actorId: string
  action: string
  targetType: string | null
  targetId: string | null
  details: any
  ipAddress?: string
  userAgent?: string
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details: JSON.stringify(params.details),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })
  } catch (e) {
    console.error('Failed to create audit log:', e)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' } as any, { status: 401 })

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Chỉ quản trị viên mới có thể phục hồi người dùng' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        status: true,
        password: true,
        firstName: true,
        lastName: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        metadata: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    if (user.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Người dùng đã ở trạng thái hoạt động' }, { status: 400 })
    }

    let meta: any = {}
    try {
      meta = user.metadata ? JSON.parse(user.metadata) : {}
    } catch {
      meta = {}
    }

    const previousEmail = typeof meta.previousEmail === 'string' && meta.previousEmail.trim() ? meta.previousEmail.trim() : null
    const previousFirstName = typeof meta.previousFirstName === 'string' ? meta.previousFirstName : null
    const previousLastName = typeof meta.previousLastName === 'string' ? meta.previousLastName : null
    const previousAvatar = typeof meta.previousAvatar === 'string' ? meta.previousAvatar : null
    const previousCoverPhoto = typeof meta.previousCoverPhoto === 'string' ? meta.previousCoverPhoto : null
    const previousBio = typeof meta.previousBio === 'string' ? meta.previousBio : null
    const previousPhone = typeof meta.previousPhone === 'string' ? meta.previousPhone : null
    const previousDateOfBirth = typeof meta.previousDateOfBirth === 'string' ? meta.previousDateOfBirth : null

    let emailToRestore: string | null = previousEmail
    let emailConflictWith: string | null = null
    if (emailToRestore) {
      const conflict = await prisma.user.findUnique({
        where: { email: emailToRestore },
        select: { id: true },
      })
      if (conflict && conflict.id !== user.id) {
        emailConflictWith = conflict.id
        emailToRestore = null
      }
    }

    let dob: Date | null = null
    if (previousDateOfBirth) {
      const d = new Date(previousDateOfBirth)
      if (!isNaN(d.getTime())) dob = d
    }

    const restoredAt = new Date().toISOString()
    meta.restoredAt = restoredAt
    meta.restoredBy = session.user.id
    if (emailConflictWith) {
      meta.restoreEmailConflict = { email: previousEmail, conflictUserId: emailConflictWith }
    } else if (previousEmail) {
      meta.restoreEmailConflict = null
    }

    const nextFirstName =
      previousFirstName ||
      (user.firstName === 'Đã' && user.lastName === 'xóa' ? 'Người dùng' : user.firstName)
    const nextLastName =
      previousLastName ||
      (user.firstName === 'Đã' && user.lastName === 'xóa' ? 'khôi phục' : user.lastName)

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        ...(emailToRestore ? { email: emailToRestore } : {}),
        firstName: nextFirstName,
        lastName: nextLastName,
        avatar: previousAvatar ?? user.avatar,
        coverPhoto: previousCoverPhoto ?? user.coverPhoto,
        bio: previousBio ?? user.bio,
        phone: previousPhone ?? user.phone,
        dateOfBirth: dob ?? user.dateOfBirth,
        metadata: JSON.stringify(meta),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog({
      actorId: session.user.id,
      action: 'user.restore',
      targetType: 'user',
      targetId: user.id,
      details: {
        restoredAt,
        restoredEmail: emailToRestore || null,
        previousEmail: previousEmail,
        emailConflictWith,
      },
      ipAddress,
      userAgent,
    })

    // Revalidate pages that may show this user
    revalidatePath('/dashboard/admin/users')
    revalidatePath('/dashboard/users')
    revalidatePath('/dashboard')

    return NextResponse.json(
      {
        message: 'Đã phục hồi người dùng',
        user: updated,
        warning: emailConflictWith
          ? 'Email cũ đã được sử dụng bởi tài khoản khác; chưa thể khôi phục email.'
          : null,
        needsPasswordReset: user.password == null,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error restoring user:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi phục hồi người dùng' }, { status: 500 })
  }
}


