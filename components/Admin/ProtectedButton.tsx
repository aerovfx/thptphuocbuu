'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'
import { usePermissions } from '@/hooks/usePermissions'

interface ProtectedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  resource: string
  action: string
  children: ReactNode
  requireAll?: Array<{ resource: string; action: string }>
  requireAny?: Array<{ resource: string; action: string }>
  fallback?: ReactNode
}

/**
 * Button component that is only rendered if user has required permissions
 */
export default function ProtectedButton({
  resource,
  action,
  children,
  requireAll,
  requireAny,
  fallback = null,
  ...buttonProps
}: ProtectedButtonProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isAdmin, loading } = usePermissions()

  if (loading) {
    return <>{fallback}</>
  }

  // Admin always has access
  if (isAdmin) {
    return <button {...buttonProps}>{children}</button>
  }

  // Check single permission
  if (!requireAll && !requireAny) {
    if (hasPermission(resource, action)) {
      return <button {...buttonProps}>{children}</button>
    }
    return <>{fallback}</>
  }

  // Check multiple permissions (AND)
  if (requireAll) {
    if (hasAllPermissions(requireAll)) {
      return <button {...buttonProps}>{children}</button>
    }
    return <>{fallback}</>
  }

  // Check multiple permissions (OR)
  if (requireAny) {
    if (hasAnyPermission(requireAny)) {
      return <button {...buttonProps}>{children}</button>
    }
    return <>{fallback}</>
  }

  return <>{fallback}</>
}

