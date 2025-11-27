/**
 * Space RBAC (Role-Based Access Control)
 * Kiểm tra quyền truy cập của user vào spaces và các hành động trong spaces
 */

import { prisma } from './prisma'

export interface SpacePermission {
  canRead: boolean
  canWrite: boolean
  canManage: boolean
  canApprove: boolean
  canPublish: boolean
}

export interface SpaceAccessResult {
  hasAccess: boolean
  permission: SpacePermission
  reason?: string
}

/**
 * Kiểm tra quyền truy cập của user vào space
 */
export async function checkSpaceAccess(
  userId: string,
  userRole: string,
  spaceId: string,
  action: 'read' | 'write' | 'manage' | 'approve' | 'publish' = 'read'
): Promise<SpaceAccessResult> {
  try {
    // Get space
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        members: {
          where: { userId },
        },
      },
    })

    if (!space) {
      return {
        hasAccess: false,
        permission: {
          canRead: false,
          canWrite: false,
          canManage: false,
          canApprove: false,
          canPublish: false,
        },
        reason: 'Space không tồn tại',
      }
    }

    // Super Admin và Admin có full access
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return {
        hasAccess: true,
        permission: {
          canRead: true,
          canWrite: true,
          canManage: true,
          canApprove: true,
          canPublish: true,
        },
      }
    }

    // BGH có quyền approve và publish
    if (userRole === 'BGH') {
      const canAccess =
        space.visibility === 'PUBLIC' ||
        space.visibility === 'INTERNAL' ||
        space.members.length > 0

      return {
        hasAccess: canAccess,
        permission: {
          canRead: canAccess,
          canWrite: canAccess,
          canManage: space.type === 'BGH_SPACE',
          canApprove: true,
          canPublish: true,
        },
      }
    }

    // Check if user is a member
    const member = space.members[0]

    // Public spaces - everyone can read
    if (space.visibility === 'PUBLIC') {
      return {
        hasAccess: action === 'read' || !!member,
        permission: {
          canRead: true,
          canWrite: member?.canWrite || false,
          canManage: member?.canManage || false,
          canApprove: false,
          canPublish: false,
        },
      }
    }

    // Internal spaces - authenticated users can read, members can write
    if (space.visibility === 'INTERNAL') {
      return {
        hasAccess: true,
        permission: {
          canRead: true,
          canWrite: member?.canWrite || false,
          canManage: member?.canManage || false,
          canApprove: false,
          canPublish: false,
        },
      }
    }

    // Private spaces - only members can access
    if (space.visibility === 'PRIVATE') {
      if (!member) {
        return {
          hasAccess: false,
          permission: {
            canRead: false,
            canWrite: false,
            canManage: false,
            canApprove: false,
            canPublish: false,
          },
          reason: 'Bạn không phải thành viên của space này',
        }
      }

      return {
        hasAccess: true,
        permission: {
          canRead: member.canRead,
          canWrite: member.canWrite,
          canManage: member.canManage,
          canApprove: false,
          canPublish: false,
        },
      }
    }

    return {
      hasAccess: false,
      permission: {
        canRead: false,
        canWrite: false,
        canManage: false,
        canApprove: false,
        canPublish: false,
      },
      reason: 'Không xác định được quyền truy cập',
    }
  } catch (error) {
    console.error('Error checking space access:', error)
    return {
      hasAccess: false,
      permission: {
        canRead: false,
        canWrite: false,
        canManage: false,
        canApprove: false,
        canPublish: false,
      },
      reason: 'Lỗi khi kiểm tra quyền truy cập',
    }
  }
}

/**
 * Kiểm tra quyền của user trong department
 */
export async function checkDepartmentAccess(
  userId: string,
  userRole: string,
  departmentId: string,
  action: 'read' | 'write' | 'manage' = 'read'
): Promise<SpaceAccessResult> {
  try {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        members: {
          where: { userId },
        },
        space: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!department) {
      return {
        hasAccess: false,
        permission: {
          canRead: false,
          canWrite: false,
          canManage: false,
          canApprove: false,
          canPublish: false,
        },
        reason: 'Department không tồn tại',
      }
    }

    // Super Admin, Admin, BGH có full access
    if (['SUPER_ADMIN', 'ADMIN', 'BGH'].includes(userRole)) {
      return {
        hasAccess: true,
        permission: {
          canRead: true,
          canWrite: true,
          canManage: true,
          canApprove: true,
          canPublish: true,
        },
      }
    }

    // Leader có quyền manage
    if (department.leaderId === userId) {
      return {
        hasAccess: true,
        permission: {
          canRead: true,
          canWrite: true,
          canManage: true,
          canApprove: false,
          canPublish: false,
        },
      }
    }

    // Member có quyền read/write tùy role
    const member = department.members[0]
    if (member) {
      return {
        hasAccess: true,
        permission: {
          canRead: true,
          canWrite: member.role !== 'VIEWER',
          canManage: member.role === 'LEADER' || member.role === 'DEPUTY',
          canApprove: false,
          canPublish: false,
        },
      }
    }

    // Check space access if department has space
    if (department.space) {
      const spaceAccess = await checkSpaceAccess(userId, userRole, department.space.id, action)
      if (spaceAccess.hasAccess) {
        return {
          hasAccess: true,
          permission: {
            ...spaceAccess.permission,
            canManage: false, // Department members can't manage space
          },
        }
      }
    }

    return {
      hasAccess: false,
      permission: {
        canRead: false,
        canWrite: false,
        canManage: false,
        canApprove: false,
        canPublish: false,
      },
      reason: 'Bạn không phải thành viên của department này',
    }
  } catch (error) {
    console.error('Error checking department access:', error)
    return {
      hasAccess: false,
      permission: {
        canRead: false,
        canWrite: false,
        canManage: false,
        canApprove: false,
        canPublish: false,
      },
      reason: 'Lỗi khi kiểm tra quyền truy cập',
    }
  }
}

/**
 * Kiểm tra quyền approve văn bản dựa trên workflow
 */
export async function checkDocumentApprovalPermission(
  userId: string,
  userRole: string,
  documentId: string,
  documentType: 'OUTGOING' | 'INCOMING'
): Promise<boolean> {
  // BGH có quyền approve tất cả
  if (userRole === 'BGH') {
    return true
  }

  // Ban TT có quyền approve trước khi gửi BGH
  if (userRole === 'BAN_TT') {
    // Logic kiểm tra workflow step
    return true
  }

  // Trưởng tổ có quyền approve văn bản của tổ mình
  // TODO: Implement logic based on workflow

  return false
}

/**
 * Lấy danh sách spaces mà user có quyền truy cập
 */
export async function getUserAccessibleSpaces(
  userId: string,
  userRole: string
): Promise<string[]> {
  try {
    // Super Admin và Admin có access tất cả
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      const allSpaces = await prisma.space.findMany({
        where: { isActive: true },
        select: { id: true },
      })
      return allSpaces.map((s) => s.id)
    }

    // Get spaces where user is member
    const memberSpaces = await prisma.spaceMember.findMany({
      where: { userId },
      select: { spaceId: true },
    })

    // Get public and internal spaces
    const publicSpaces = await prisma.space.findMany({
      where: {
        isActive: true,
        visibility: {
          in: ['PUBLIC', 'INTERNAL'],
        },
      },
      select: { id: true },
    })

    const spaceIds = new Set([
      ...memberSpaces.map((m) => m.spaceId),
      ...publicSpaces.map((s) => s.id),
    ])

    // BGH có access thêm BGH_SPACE
    if (userRole === 'BGH') {
      const bghSpace = await prisma.space.findFirst({
        where: { type: 'BGH_SPACE', isActive: true },
        select: { id: true },
      })
      if (bghSpace) {
        spaceIds.add(bghSpace.id)
      }
    }

    return Array.from(spaceIds)
  } catch (error) {
    console.error('Error getting user accessible spaces:', error)
    return []
  }
}

