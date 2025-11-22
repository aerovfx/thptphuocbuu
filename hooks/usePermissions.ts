'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * React hook to check user permissions on the client side
 */
export function usePermissions() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!session?.user?.id) {
        setPermissions([])
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/admin/permissions/me')
        if (response.ok) {
          const data = await response.json()
          setPermissions(data.permissions || [])
        }
      } catch (error) {
        console.error('Error fetching permissions:', error)
        setPermissions([])
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [session])

  const hasPermission = (resource: string, action: string): boolean => {
    if (!session?.user) return false
    // Admin always has all permissions
    if (session.user.role === 'ADMIN') return true
    return permissions.includes(`${resource}:${action}`)
  }

  const hasAnyPermission = (checks: Array<{ resource: string; action: string }>): boolean => {
    return checks.some((check) => hasPermission(check.resource, check.action))
  }

  const hasAllPermissions = (checks: Array<{ resource: string; action: string }>): boolean => {
    return checks.every((check) => hasPermission(check.resource, check.action))
  }

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: session?.user?.role === 'ADMIN',
  }
}

