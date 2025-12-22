import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { hasPermission, hasRole, hasAnyRole, canAccessModule } from './rbac'

/**
 * RBAC Middleware for API Routes
 * 
 * This middleware can be used to protect API routes with permission checks
 */

export interface PermissionRequirement {
  resource: string
  action: string
}

export interface RoleRequirement {
  role?: string
  roles?: string[]
}

export interface ModuleRequirement {
  moduleKey: string
  action?: string
}

export type RBACRequirement = PermissionRequirement | RoleRequirement | ModuleRequirement

/**
 * Check if requirement is a permission requirement
 */
function isPermissionRequirement(req: RBACRequirement): req is PermissionRequirement {
  return 'resource' in req && 'action' in req
}

/**
 * Check if requirement is a role requirement
 */
function isRoleRequirement(req: RBACRequirement): req is RoleRequirement {
  return 'role' in req || 'roles' in req
}

/**
 * Check if requirement is a module requirement
 */
function isModuleRequirement(req: RBACRequirement): req is ModuleRequirement {
  return 'moduleKey' in req
}

/**
 * RBAC Middleware - Check permissions/roles before allowing access
 */
export async function requireRBAC(
  request: NextRequest,
  requirement: RBACRequirement | RBACRequirement[]
): Promise<{ authorized: boolean; session?: any; error?: string }> {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return {
        authorized: false,
        error: 'Unauthorized: Authentication required',
      }
    }

    const userId = session.user.id

    // Admin always has access
    if (session.user.role === 'ADMIN') {
      return { authorized: true, session }
    }

    // Handle single or multiple requirements
    const requirements = Array.isArray(requirement) ? requirement : [requirement]

    // Check all requirements (AND logic - user must satisfy all)
    for (const req of requirements) {
      if (isPermissionRequirement(req)) {
        const hasAccess = await hasPermission(userId, req.resource, req.action)
        if (!hasAccess) {
          return {
            authorized: false,
            session,
            error: `Permission denied: ${req.resource}:${req.action}`,
          }
        }
      } else if (isRoleRequirement(req)) {
        if (req.role) {
          const hasAccess = await hasRole(userId, req.role)
          if (!hasAccess) {
            return {
              authorized: false,
              session,
              error: `Role required: ${req.role}`,
            }
          }
        } else if (req.roles) {
          const hasAccess = await hasAnyRole(userId, req.roles)
          if (!hasAccess) {
            return {
              authorized: false,
              session,
              error: `One of these roles required: ${req.roles.join(', ')}`,
            }
          }
        }
      } else if (isModuleRequirement(req)) {
        const hasAccess = await canAccessModule(userId, req.moduleKey, req.action)
        if (!hasAccess) {
          return {
            authorized: false,
            session,
            error: `Module access denied: ${req.moduleKey}`,
          }
        }
      }
    }

    return { authorized: true, session }
  } catch (error) {
    console.error('RBAC middleware error:', error)
    return {
      authorized: false,
      error: 'Internal server error',
    }
  }
}

/**
 * Wrapper for API route handlers with RBAC protection
 */
export function withRBAC(
  requirement: RBACRequirement | RBACRequirement[],
  handler: (request: NextRequest, context: { session: any }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const rbacResult = await requireRBAC(request, requirement)

    if (!rbacResult.authorized) {
      return NextResponse.json(
        { error: rbacResult.error || 'Access denied' },
        { status: 403 }
      )
    }

    return handler(request, { session: rbacResult.session, ...context })
  }
}

/**
 * Helper to check if user is admin
 */
export async function requireAdmin(request: NextRequest): Promise<{ authorized: boolean; session?: any; error?: string }> {
  return requireRBAC(request, { role: 'ADMIN' })
}

/**
 * Helper to check if user has admin role (from UserRole enum)
 */
export async function requireAdminRole(request: NextRequest): Promise<{ authorized: boolean; session?: any; error?: string }> {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return {
        authorized: false,
        error: 'Unauthorized: Authentication required',
      }
    }

    if (session.user.role !== 'ADMIN') {
      return {
        authorized: false,
        session,
        error: 'Admin role required',
      }
    }

    return { authorized: true, session }
  } catch (error) {
    console.error('Admin check error:', error)
    return {
      authorized: false,
      error: 'Internal server error',
    }
  }
}

