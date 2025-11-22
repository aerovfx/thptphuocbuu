import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPermissions } from '@/lib/rbac'

// GET /api/admin/permissions/me - Get current user's permissions
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Admin always has all permissions (conceptually)
    if (session.user.role === 'ADMIN') {
      return NextResponse.json({
        permissions: ['*:*'], // Wildcard for admin
        isAdmin: true,
      })
    }

    // Get user's actual permissions from roles
    const permissions = await getUserPermissions(userId)

    return NextResponse.json({
      permissions,
      isAdmin: false,
    })
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy quyền' },
      { status: 500 }
    )
  }
}

