import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
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

const schema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = await resolveCurrentUserId(session)
    if (!userId) {
      return NextResponse.json({ error: 'Session không hợp lệ. Vui lòng đăng nhập lại.' }, { status: 401 })
    }

    const body = await request.json()
    const data = schema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // If user already has a password, require currentPassword
    if (user.password) {
      if (!data.currentPassword) {
        return NextResponse.json({ error: 'Vui lòng nhập mật khẩu hiện tại' }, { status: 400 })
      }
      const ok = await bcrypt.compare(data.currentPassword.trim(), user.password)
      if (!ok) {
        return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 400 })
      }
    }

    // Prevent setting same password (best-effort)
    if (user.password) {
      const same = await bcrypt.compare(data.newPassword.trim(), user.password)
      if (same) {
        return NextResponse.json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại' }, { status: 400 })
      }
    }

    const hashed = await bcrypt.hash(data.newPassword.trim(), 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    })

    return NextResponse.json(
      {
        message: user.password ? 'Đổi mật khẩu thành công' : 'Đặt mật khẩu thành công',
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: error.errors }, { status: 400 })
    }
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi đổi mật khẩu' }, { status: 500 })
  }
}


