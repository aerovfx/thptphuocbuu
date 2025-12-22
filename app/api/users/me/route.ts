import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function resolveCurrentUserId(session: any): Promise<string | null> {
  const id = session?.user?.id
  const email = session?.user?.email

  if (typeof id === 'string' && id.trim()) {
    const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (exists) return id
  }

  if (typeof email === 'string' && email.trim()) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    return user?.id || null
  }

  return null
}

const updateSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(50).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
  dateOfBirth: z
    .union([
      z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/), // Valid date format
      z.string().trim().length(0), // Empty string
      z.null(), // Null
    ])
    .transform((val) => {
      // Transform empty string to null
      if (val === '' || val === null) return null
      return val
    })
    .optional()
    .nullable(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = await resolveCurrentUserId(session)
    if (!userId) {
      return NextResponse.json({ error: 'Session không hợp lệ. Vui lòng đăng nhập lại.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        coverPhoto: true,
        role: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
        password: true,
        accounts: {
          select: { provider: true },
        },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const providers = Array.from(new Set((user.accounts || []).map((a) => a.provider))).sort()

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        role: user.role,
        bio: user.bio,
        phone: user.phone,
        // Return as YYYY-MM-DD for stable client rendering (date input)
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        hasPassword: !!user.password,
        providers,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi lấy thông tin tài khoản' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = await resolveCurrentUserId(session)
    if (!userId) {
      return NextResponse.json({ error: 'Session không hợp lệ. Vui lòng đăng nhập lại.' }, { status: 401 })
    }

    const body = await request.json()
    console.log('[Update Profile] Request body:', JSON.stringify(body, null, 2))
    
    const data = updateSchema.parse(body)
    console.log('[Update Profile] Parsed data:', JSON.stringify(data, null, 2))

    let dobDate: Date | null = null
    if (data.dateOfBirth && data.dateOfBirth !== null && data.dateOfBirth.trim() !== '') {
      // Store at noon UTC to avoid timezone-induced day/year shifts when reading
      dobDate = new Date(`${data.dateOfBirth}T12:00:00.000Z`)
      if (isNaN(dobDate.getTime())) {
        console.error('[Update Profile] Invalid date format:', data.dateOfBirth)
        return NextResponse.json({ error: 'Ngày sinh không hợp lệ' }, { status: 400 })
      }
      console.log('[Update Profile] Parsed dateOfBirth:', dobDate.toISOString())
    } else {
      console.log('[Update Profile] dateOfBirth is null or empty, will set to null')
    }

    const updateData: any = {}
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.phone !== undefined) updateData.phone = data.phone || null
    if (data.bio !== undefined) updateData.bio = data.bio || null
    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = dobDate
      console.log('[Update Profile] Setting dateOfBirth in updateData:', updateData.dateOfBirth)
    }

    console.log('[Update Profile] Update data:', JSON.stringify(updateData, null, 2))

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        coverPhoto: true,
        role: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Đã cập nhật thông tin cá nhân',
        user: {
          ...updated,
          dateOfBirth: updated.dateOfBirth ? updated.dateOfBirth.toISOString().slice(0, 10) : null,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: error.errors }, { status: 400 })
    }
    console.error('Error updating current user:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi cập nhật thông tin cá nhân' }, { status: 500 })
  }
}


