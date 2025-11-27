/**
 * Middleware để kiểm tra quyền truy cập spaces trong API routes
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { checkSpaceAccess, checkDepartmentAccess } from './space-rbac'

/**
 * Middleware để kiểm tra quyền truy cập space
 */
export async function requireSpaceAccess(
  spaceId: string,
  action: 'read' | 'write' | 'manage' | 'approve' | 'publish' = 'read'
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      hasAccess: false,
    }
  }

  const accessResult = await checkSpaceAccess(
    session.user.id,
    session.user.role,
    spaceId,
    action
  )

  if (!accessResult.hasAccess) {
    return {
      error: NextResponse.json(
        {
          error: accessResult.reason || 'Bạn không có quyền truy cập space này',
          permission: accessResult.permission,
        },
        { status: 403 }
      ),
      hasAccess: false,
    }
  }

  return {
    hasAccess: true,
    permission: accessResult.permission,
    session,
  }
}

/**
 * Middleware để kiểm tra quyền truy cập department
 */
export async function requireDepartmentAccess(
  departmentId: string,
  action: 'read' | 'write' | 'manage' = 'read'
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      hasAccess: false,
    }
  }

  const accessResult = await checkDepartmentAccess(
    session.user.id,
    session.user.role,
    departmentId,
    action
  )

  if (!accessResult.hasAccess) {
    return {
      error: NextResponse.json(
        {
          error: accessResult.reason || 'Bạn không có quyền truy cập department này',
          permission: accessResult.permission,
        },
        { status: 403 }
      ),
      hasAccess: false,
    }
  }

  return {
    hasAccess: true,
    permission: accessResult.permission,
    session,
  }
}

/**
 * Helper để kiểm tra role có quyền quản lý spaces/departments không
 */
export function canManageSpaces(role: string): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'BGH'].includes(role)
}

export function canManageDepartments(role: string): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'BGH', 'TRUONG_TONG'].includes(role)
}

