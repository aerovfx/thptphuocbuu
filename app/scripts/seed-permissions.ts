/**
 * Seed default permissions for the system
 * Run this script to create initial permissions
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultPermissions = [
  // User Management
  { resource: 'module:user', action: 'read', description: 'Xem danh sách người dùng' },
  { resource: 'module:user', action: 'write', description: 'Tạo và chỉnh sửa người dùng' },
  { resource: 'module:user', action: 'delete', description: 'Xóa người dùng' },
  { resource: 'module:user', action: 'export', description: 'Xuất danh sách người dùng' },

  // Role Management
  { resource: 'module:role', action: 'read', description: 'Xem danh sách vai trò' },
  { resource: 'module:role', action: 'write', description: 'Tạo và chỉnh sửa vai trò' },
  { resource: 'module:role', action: 'delete', description: 'Xóa vai trò' },

  // Permission Management
  { resource: 'module:permission', action: 'read', description: 'Xem danh sách quyền' },
  { resource: 'module:permission', action: 'write', description: 'Tạo và chỉnh sửa quyền' },
  { resource: 'module:permission', action: 'delete', description: 'Xóa quyền' },

  // Module Management
  { resource: 'module:module', action: 'read', description: 'Xem danh sách modules' },
  { resource: 'module:module', action: 'write', description: 'Tạo và chỉnh sửa modules' },
  { resource: 'module:module', action: 'delete', description: 'Xóa modules' },
  { resource: 'module:module', action: 'configure', description: 'Cấu hình modules' },

  // Audit Logs
  { resource: 'module:audit', action: 'read', description: 'Xem audit logs' },
  { resource: 'module:audit', action: 'export', description: 'Xuất audit logs' },

  // Document Management
  { resource: 'module:document', action: 'read', description: 'Xem tài liệu' },
  { resource: 'module:document', action: 'write', description: 'Tạo và chỉnh sửa tài liệu' },
  { resource: 'module:document', action: 'delete', description: 'Xóa tài liệu' },
  { resource: 'module:document', action: 'approve', description: 'Phê duyệt tài liệu' },

  // Class Management
  { resource: 'module:class', action: 'read', description: 'Xem lớp học' },
  { resource: 'module:class', action: 'write', description: 'Tạo và chỉnh sửa lớp học' },
  { resource: 'module:class', action: 'delete', description: 'Xóa lớp học' },

  // Assignment Management
  { resource: 'module:assignment', action: 'read', description: 'Xem bài tập' },
  { resource: 'module:assignment', action: 'write', description: 'Tạo và chỉnh sửa bài tập' },
  { resource: 'module:assignment', action: 'delete', description: 'Xóa bài tập' },
  { resource: 'module:assignment', action: 'grade', description: 'Chấm điểm bài tập' },
]

async function main() {
  console.log('🌱 Seeding default permissions...')

  for (const perm of defaultPermissions) {
    try {
      await prisma.permission.upsert({
        where: {
          resource_action: {
            resource: perm.resource,
            action: perm.action,
          },
        },
        update: {
          description: perm.description,
        },
        create: {
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
        },
      })
      console.log(`✅ Created/Updated permission: ${perm.resource}:${perm.action}`)
    } catch (error: any) {
      console.error(`❌ Error creating permission ${perm.resource}:${perm.action}:`, error.message)
    }
  }

  console.log('✅ Finished seeding permissions')
}

main()
  .catch((error) => {
    console.error('Error seeding permissions:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

