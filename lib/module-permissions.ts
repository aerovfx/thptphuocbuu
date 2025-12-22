import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

/**
 * Kiểm tra user có quyền truy cập module không dựa trên permissions
 */
export async function hasModulePermission(
  userId: string,
  userRole: UserRole,
  moduleKey: string,
  action: string = 'read'
): Promise<boolean> {
  try {
    // Get module
    const module = await prisma.module.findUnique({
      where: { key: moduleKey },
      include: {
        modulePermissions: {
          include: {
            permission: true,
            role: true,
          },
        },
      },
    })

    if (!module || !module.enabled) {
      return false
    }

    // Get user's roles
    const userRoles = await prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: true },
    })

    const userRoleNames = userRoles.map((ur) => ur.role.name)
    // Add the user's primary role
    userRoleNames.push(userRole)

    // Check if any module permission matches
    for (const mp of module.modulePermissions) {
      // Check if permission action matches
      if (mp.permission.action !== action && mp.permission.action !== '*') {
        continue
      }

      // If no role specified, permission applies to all roles
      if (!mp.roleId) {
        return true
      }

      // Check if user has the required role
      if (mp.role?.name && userRoleNames.includes(mp.role.name as UserRole)) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error checking module permission:', error)
    return false
  }
}

/**
 * Lấy danh sách modules mà user có quyền truy cập
 */
export async function getAccessibleModules(
  userId: string,
  userRole: UserRole
): Promise<string[]> {
  try {
    const modules = await prisma.module.findMany({
      where: { enabled: true },
      include: {
        modulePermissions: {
          include: {
            permission: true,
            role: true,
          },
        },
      },
    })

    const accessibleModules: string[] = []

    // Get user's roles
    const userRoles = await prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: true },
    })

    const userRoleNames = userRoles.map((ur) => ur.role.name)
    userRoleNames.push(userRole)

    for (const module of modules) {
      // If module has no permissions, check default access
      if (module.modulePermissions.length === 0) {
        // Default: check if module is enabled
        accessibleModules.push(module.key)
        continue
      }

      // Check if user has any permission for this module
      for (const mp of module.modulePermissions) {
        if (mp.permission.action === 'read' || mp.permission.action === '*') {
          // If no role specified, permission applies to all
          if (!mp.roleId) {
            accessibleModules.push(module.key)
            break
          }

          // Check if user has the required role
          if (mp.role?.name && userRoleNames.includes(mp.role.name as UserRole)) {
            accessibleModules.push(module.key)
            break
          }
        }
      }
    }

    return accessibleModules
  } catch (error) {
    console.error('Error getting accessible modules:', error)
    return []
  }
}

