import { NextRequest, NextResponse } from 'next/server'
import { requireRBAC } from '@/lib/rbac-middleware'

/**
 * Example API route protected with RBAC
 * 
 * This demonstrates how to use RBAC middleware to protect API routes
 */

// Example 1: Require specific permission
export async function GET(request: NextRequest) {
  const rbacResult = await requireRBAC(request, {
    resource: 'module:user',
    action: 'read',
  })

  if (!rbacResult.authorized) {
    return NextResponse.json(
      { error: rbacResult.error || 'Access denied' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    message: 'You have permission to read users',
    user: rbacResult.session?.user,
  })
}

// Example 2: Require multiple permissions (AND)
export async function POST(request: NextRequest) {
  const rbacResult = await requireRBAC(request, [
    { resource: 'module:user', action: 'read' },
    { resource: 'module:user', action: 'write' },
  ])

  if (!rbacResult.authorized) {
    return NextResponse.json(
      { error: rbacResult.error || 'Access denied' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    message: 'You have permission to read and write users',
  })
}

// Example 3: Require module access
export async function PUT(request: NextRequest) {
  const rbacResult = await requireRBAC(request, {
    moduleKey: 'user_mgmt',
    action: 'write',
  })

  if (!rbacResult.authorized) {
    return NextResponse.json(
      { error: rbacResult.error || 'Access denied' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    message: 'You have access to user_mgmt module',
  })
}

