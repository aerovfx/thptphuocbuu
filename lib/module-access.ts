import { prisma } from './prisma'

/**
 * Map premium plans to module keys
 * This defines which modules are unlocked for each premium plan
 */
export const PREMIUM_PLAN_MODULES: Record<string, string[]> = {
  STANDARD: [
    'classes', // Example: Standard plan unlocks classes module
    'social',
  ],
  PRO: [
    'classes',
    'social',
    'documents',
    'spaces',
  ],
  ENTERPRISE: [
    'classes',
    'social',
    'documents',
    'spaces',
    'departments',
    'reports',
  ],
}

/**
 * Grant module access to user based on premium plan
 */
export async function grantModulesForPremiumPlan(
  userId: string,
  plan: 'STANDARD' | 'PRO' | 'ENTERPRISE',
  reason?: string
) {
  const moduleKeys = PREMIUM_PLAN_MODULES[plan] || []
  
  if (moduleKeys.length === 0) {
    return { granted: 0, modules: [] }
  }

  // Find modules by keys
  const modules = await prisma.module.findMany({
    where: {
      key: { in: moduleKeys },
      enabled: true, // Only grant access to enabled modules
    },
    select: { id: true, key: true, name: true },
  })

  if (modules.length === 0) {
    return { granted: 0, modules: [] }
  }

  // Grant access to all modules for this plan
  let grantedCount = 0
  for (const module of modules) {
    try {
      await prisma.userModuleAccess.upsert({
        where: {
          userId_moduleId: {
            userId,
            moduleId: module.id,
          },
        },
        update: {
          reason: reason || `PREMIUM_${plan}`,
          updatedAt: new Date(),
        },
        create: {
          userId,
          moduleId: module.id,
          reason: reason || `PREMIUM_${plan}`,
        },
      })
      grantedCount++
    } catch (error: any) {
      // Skip if already exists
      if (error.code !== 'P2002') {
        console.error(`Error granting module access:`, error)
      }
    }
  }

  return {
    granted: grantedCount,
    modules: modules.map((m) => ({ id: m.id, key: m.key, name: m.name })),
  }
}

/**
 * Revoke module access when premium subscription expires
 */
export async function revokeModulesForPremiumPlan(
  userId: string,
  plan: 'STANDARD' | 'PRO' | 'ENTERPRISE'
) {
  const moduleKeys = PREMIUM_PLAN_MODULES[plan] || []
  
  if (moduleKeys.length === 0) {
    return { revoked: 0 }
  }

  // Find modules by keys
  const modules = await prisma.module.findMany({
    where: {
      key: { in: moduleKeys },
    },
    select: { id: true },
  })

  if (modules.length === 0) {
    return { revoked: 0 }
  }

  const moduleIds = modules.map((m) => m.id)

  // Only revoke if access was granted by premium (not manual)
  const deleted = await prisma.userModuleAccess.deleteMany({
    where: {
      userId,
      moduleId: { in: moduleIds },
      reason: { startsWith: 'PREMIUM_' },
    },
  })

  return { revoked: deleted.count }
}

/**
 * Check if user has access to a module
 */
export async function hasModuleAccess(userId: string, moduleKey: string): Promise<boolean> {
  // Find module
  const module = await prisma.module.findUnique({
    where: { key: moduleKey },
    select: { id: true, enabled: true },
  })

  if (!module || !module.enabled) {
    return false
  }

  // Check if user has explicit access
  const access = await prisma.userModuleAccess.findUnique({
    where: {
      userId_moduleId: {
        userId,
        moduleId: module.id,
      },
    },
  })

  return !!access
}

/**
 * Get all modules user has access to
 */
export async function getUserAccessibleModules(userId: string): Promise<string[]> {
  const accesses = await prisma.userModuleAccess.findMany({
    where: { userId },
    include: {
      module: {
        select: { key: true, enabled: true },
      },
    },
  })

  return accesses
    .filter((access) => access.module.enabled)
    .map((access) => access.module.key)
}

