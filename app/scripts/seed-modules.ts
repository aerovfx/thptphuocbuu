/**
 * Seed default modules for the system
 * Run this script to create initial modules
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultModules = [
  {
    key: 'user_mgmt',
    name: 'User Management',
    description: 'Quản lý người dùng trong hệ thống',
    enabled: true,
    version: '1.0.0',
    config: JSON.stringify({
      allowSelfRegistration: true,
      requireEmailVerification: false,
    }),
  },
  {
    key: 'role_mgmt',
    name: 'Role & Permission Management',
    description: 'Quản lý vai trò và quyền truy cập',
    enabled: true,
    version: '1.0.0',
    config: JSON.stringify({
      allowCustomRoles: true,
    }),
  },
  {
    key: 'module_mgmt',
    name: 'Module Management',
    description: 'Quản lý các module trong hệ thống',
    enabled: true,
    version: '1.0.0',
    config: JSON.stringify({}),
  },
  {
    key: 'audit_logs',
    name: 'Audit Logs',
    description: 'Ghi lại lịch sử hoạt động của hệ thống',
    enabled: true,
    version: '1.0.0',
    config: JSON.stringify({
      retentionDays: 365,
    }),
  },
  {
    key: 'document_mgmt',
    name: 'Document Management',
    description: 'Quản lý tài liệu và văn bản',
    enabled: true,
    version: '1.0.0',
    config: JSON.stringify({
      maxFileSize: 52428800, // 50MB
      allowedFormats: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
    }),
  },
  {
    key: 'class_mgmt',
    name: 'Class Management',
    description: 'Quản lý lớp học và bài tập',
    enabled: true,
    version: '1.0.0',
    config: JSON.stringify({
      maxStudentsPerClass: 50,
    }),
  },
]

async function main() {
  console.log('🌱 Seeding default modules...')

  for (const module of defaultModules) {
    try {
      await prisma.module.upsert({
        where: { key: module.key },
        update: {
          name: module.name,
          description: module.description,
          config: module.config,
          version: module.version,
        },
        create: module,
      })
      console.log(`✅ Created/Updated module: ${module.key}`)
    } catch (error: any) {
      console.error(`❌ Error creating module ${module.key}:`, error.message)
    }
  }

  console.log('✅ Finished seeding modules')
}

main()
  .catch((error) => {
    console.error('Error seeding modules:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

