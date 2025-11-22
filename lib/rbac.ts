import { prisma } from './prisma'

/**
 * RBAC (Role-Based Access Control) Utilities
 * 
 * This module provides functions to check user permissions based on their roles
 * and assigned permissions.
 */

export interface PermissionCheck {
  resource: string
  action: string
}

/**
 * Get all permissions for a user (from their roles)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    // Get all roles assigned to user
    const userRoles = await prisma.userRoleAssignment.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    // Extract unique permissions
    const permissions = new Set<string>()
    userRoles.forEach((userRole) => {
      userRole.role.rolePermissions.forEach((rolePerm) => {
        const perm = rolePerm.permission
        permissions.add(`${perm.resource}:${perm.action}`)
      })
    })

    return Array.from(permissions)
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return []
  }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    // Admin always has all permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role === 'ADMIN') {
      return true
    }

    // Get user permissions
    const permissions = await getUserPermissions(userId)
    const requiredPermission = `${resource}:${action}`

    return permissions.includes(requiredPermission)
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  checks: PermissionCheck[]
): Promise<boolean> {
  for (const check of checks) {
    if (await hasPermission(userId, check.resource, check.action)) {
      return true
    }
  }
  return false
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  checks: PermissionCheck[]
): Promise<boolean> {
  for (const check of checks) {
    if (!(await hasPermission(userId, check.resource, check.action))) {
      return false
    }
  }
  return true
}

/**
 * Get user roles
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    const userRoles = await prisma.userRoleAssignment.findMany({
      where: { userId },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    })

    return userRoles.map((ur) => ur.role.name)
  } catch (error) {
    console.error('Error getting user roles:', error)
    return []
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    // Admin always has all roles (conceptually)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role === 'ADMIN') {
      return true
    }

    const roles = await getUserRoles(userId)
    return roles.includes(roleName)
  } catch (error) {
    console.error('Error checking role:', error)
    return false
  }
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
  try {
    // Admin always has all roles (conceptually)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role === 'ADMIN') {
      return true
    }

    const roles = await getUserRoles(userId)
    return roleNames.some((roleName) => roles.includes(roleName))
  } catch (error) {
    console.error('Error checking roles:', error)
    return false
  }
}

/**
 * Check if a module is enabled
 */
export async function isModuleEnabled(moduleKey: string): Promise<boolean> {
  try {
    const module = await prisma.module.findUnique({
      where: { key: moduleKey },
      select: { enabled: true },
    })

    return module?.enabled ?? false
  } catch (error) {
    console.error('Error checking module:', error)
    return false
  }
}

/**
 * Check if user can access a module (has permission AND module is enabled)
 */
export async function canAccessModule(
  userId: string,
  moduleKey: string,
  action: string = 'read'
): Promise<boolean> {
  // Check if module is enabled
  const moduleEnabled = await isModuleEnabled(moduleKey)
  if (!moduleEnabled) {
    return false
  }

  // Check if user has permission
  return hasPermission(userId, `module:${moduleKey}`, action)
}

