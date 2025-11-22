'use client'

import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'

interface ProtectedActionProps {
  resource: string
  action: string
  children: ReactNode
  fallback?: ReactNode
  requireAll?: Array<{ resource: string; action: string }>
  requireAny?: Array<{ resource: string; action: string }>
}

/**
 * Component to conditionally render content based on user permissions
 */
export default function ProtectedAction({
  resource,
  action,
  children,
  fallback = null,
  requireAll,
  requireAny,
}: ProtectedActionProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isAdmin } = usePermissions()

  // Admin always has access
  if (isAdmin) {
    return <>{children}</>
  }

  // Check single permission
  if (!requireAll && !requireAny) {
    if (hasPermission(resource, action)) {
      return <>{children}</>
    }
    return <>{fallback}</>
  }

  // Check multiple permissions (AND)
  if (requireAll) {
    if (hasAllPermissions(requireAll)) {
      return <>{children}</>
    }
    return <>{fallback}</>
  }

  // Check multiple permissions (OR)
  if (requireAny) {
    if (hasAnyPermission(requireAny)) {
      return <>{children}</>
    }
    return <>{fallback}</>
  }

  return <>{fallback}</>
}

