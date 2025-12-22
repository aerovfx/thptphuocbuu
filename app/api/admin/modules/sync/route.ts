import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dashboardModules } from '@/lib/dashboard-modules'

// Helper function to check admin permission
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'BGH')) {
    throw new Error('Unauthorized: Admin access required')
  }
  return session
}

// POST /api/admin/modules/sync - Sync modules from code to database
export async function POST() {
  try {
    await requireAdmin()

    const syncedModules = []
    const errors = []

    for (const moduleDef of dashboardModules) {
      try {
        // Check if module exists - handle potential createdAt conversion errors
        let existingModule
        try {
          existingModule = await prisma.module.findUnique({
            where: { key: moduleDef.id },
          })
        } catch (findError: any) {
          // If there's a createdAt conversion error, try to fix the data
          if (findError.code === 'P2023' && findError.message?.includes('createdAt')) {
            console.error(`Error reading module ${moduleDef.id}:`, findError)
            // Skip this module and continue
            errors.push({
              module: moduleDef.id,
              error: 'Lỗi đọc dữ liệu createdAt từ database',
            })
            continue
          }
          throw findError
        }

        if (existingModule) {
          // Update existing module
          const updated = await prisma.module.update({
            where: { key: moduleDef.id },
            data: {
              name: moduleDef.title,
              description: moduleDef.description || null,
              config: JSON.stringify({
                href: moduleDef.href,
                icon: moduleDef.icon,
                order: moduleDef.order,
                category: moduleDef.category,
                roles: moduleDef.roles,
              }),
            },
          })
          syncedModules.push({ action: 'updated', module: updated })
        } else {
          // Create new module
          const created = await prisma.module.create({
            data: {
              key: moduleDef.id,
              name: moduleDef.title,
              description: moduleDef.description || null,
              enabled: true, // Enable by default
              config: JSON.stringify({
                href: moduleDef.href,
                icon: moduleDef.icon,
                order: moduleDef.order,
                category: moduleDef.category,
                roles: moduleDef.roles,
              }),
              version: '1.0.0',
            },
          })
          syncedModules.push({ action: 'created', module: created })
        }
      } catch (error: any) {
        errors.push({
          module: moduleDef.id,
          error: error.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      message: 'Đồng bộ modules thành công',
      synced: syncedModules.length,
      errors: errors.length,
      details: {
        syncedModules,
        errors: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error syncing modules:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đồng bộ modules' },
      { status: 500 }
    )
  }
}

