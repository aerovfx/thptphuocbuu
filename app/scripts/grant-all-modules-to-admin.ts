import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function grantAllModulesToAdmin() {
  console.log('🔓 Đang mở tất cả module cho tài khoản admin...\n')

  try {
    // 1. Tìm tài khoản admin
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN'],
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    })

    if (adminUsers.length === 0) {
      console.error('❌ Không tìm thấy tài khoản admin nào!')
      process.exit(1)
    }

    console.log(`📋 Tìm thấy ${adminUsers.length} tài khoản admin:`)
    adminUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`)
    })

    // 2. Lấy tất cả các module
    const allModules = await prisma.module.findMany({
      select: {
        id: true,
        key: true,
        name: true,
        enabled: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    if (allModules.length === 0) {
      console.log('\n⚠️  Không tìm thấy module nào trong database!')
      console.log('💡 Chạy: npm run db:seed hoặc seed modules trước')
      return
    }

    console.log(`\n📦 Tìm thấy ${allModules.length} module:`)
    allModules.forEach((module, index) => {
      const status = module.enabled ? '✅' : '❌'
      console.log(`   ${index + 1}. ${status} ${module.name} (${module.key})`)
    })

    // 3. Enable tất cả các module nếu chưa enable
    const disabledModules = allModules.filter((m) => !m.enabled)
    if (disabledModules.length > 0) {
      console.log(`\n🔧 Đang bật ${disabledModules.length} module chưa được kích hoạt...`)
      for (const module of disabledModules) {
        await prisma.module.update({
          where: { id: module.id },
          data: { enabled: true },
        })
        console.log(`   ✅ Đã bật: ${module.name}`)
      }
    }

    // 4. Cấp quyền truy cập tất cả module cho từng admin
    console.log(`\n🔐 Đang cấp quyền truy cập module cho ${adminUsers.length} tài khoản admin...`)

    let totalGranted = 0
    for (const admin of adminUsers) {
      console.log(`\n👤 Xử lý cho: ${admin.email}`)
      let grantedCount = 0

      for (const module of allModules) {
        try {
          await prisma.userModuleAccess.upsert({
            where: {
              userId_moduleId: {
                userId: admin.id,
                moduleId: module.id,
              },
            },
            update: {
              reason: 'ADMIN_FULL_ACCESS',
              grantedBy: admin.id,
              updatedAt: new Date(),
            },
            create: {
              userId: admin.id,
              moduleId: module.id,
              reason: 'ADMIN_FULL_ACCESS',
              grantedBy: admin.id,
            },
          })
          grantedCount++
        } catch (error: any) {
          if (error.code !== 'P2002') {
            console.error(`   ⚠️  Lỗi khi cấp quyền module ${module.name}:`, error.message)
          }
        }
      }

      console.log(`   ✅ Đã cấp quyền ${grantedCount}/${allModules.length} module`)
      totalGranted += grantedCount
    }

    // 5. Tóm tắt
    console.log('\n' + '='.repeat(80))
    console.log('📊 TÓM TẮT:')
    console.log(`   👥 Số tài khoản admin: ${adminUsers.length}`)
    console.log(`   📦 Tổng số module: ${allModules.length}`)
    console.log(`   🔧 Module đã bật: ${allModules.length}`)
    console.log(`   🔐 Tổng số quyền đã cấp: ${totalGranted}`)
    console.log('='.repeat(80))

    // 6. Kiểm tra lại
    console.log('\n🔍 Kiểm tra lại quyền truy cập...')
    for (const admin of adminUsers) {
      const accessCount = await prisma.userModuleAccess.count({
        where: { userId: admin.id },
      })
      const accessibleModules = await prisma.userModuleAccess.findMany({
        where: { userId: admin.id },
        include: {
          module: {
            select: { key: true, name: true, enabled: true },
          },
        },
      })

      console.log(`\n   ${admin.email}:`)
      console.log(`      - Số module có quyền: ${accessCount}`)
      console.log(`      - Module đã bật: ${accessibleModules.filter((a) => a.module.enabled).length}`)
      console.log(`      - Module chưa bật: ${accessibleModules.filter((a) => !a.module.enabled).length}`)
    }

    console.log('\n✅ Hoàn thành! Tất cả module đã được mở cho tài khoản admin.')
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

grantAllModulesToAdmin()
  .catch((error) => {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  })
