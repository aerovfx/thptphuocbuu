import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Các module cần cấp quyền cho giáo viên
const TEACHER_MODULES = ['social', 'spaces', 'documents']

async function grantModulesToTeachers() {
  console.log('👨‍🏫 Đang cấp quyền module cho tài khoản giáo viên...\n')
  console.log('📦 Các module sẽ được cấp:')
  TEACHER_MODULES.forEach((key, index) => {
    console.log(`   ${index + 1}. ${key}`)
  })
  console.log()

  try {
    // 1. Tìm tất cả tài khoản giáo viên
    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: {
        email: 'asc',
      },
    })

    if (teachers.length === 0) {
      console.log('⚠️  Không tìm thấy tài khoản giáo viên nào!')
      return
    }

    console.log(`📋 Tìm thấy ${teachers.length} tài khoản giáo viên:`)
    teachers.forEach((teacher, index) => {
      console.log(`   ${index + 1}. ${teacher.email} (${teacher.firstName} ${teacher.lastName})`)
    })

    // 2. Tìm hoặc tạo các module cần thiết
    console.log(`\n🔍 Đang kiểm tra các module...`)
    const modules = []
    
    for (const moduleKey of TEACHER_MODULES) {
      let module = await prisma.module.findUnique({
        where: { key: moduleKey },
        select: {
          id: true,
          key: true,
          name: true,
          enabled: true,
        },
      })

      // Nếu module chưa tồn tại, tạo mới
      if (!module) {
        const moduleNames: Record<string, string> = {
          social: 'Mạng xã hội',
          spaces: 'Spaces',
          documents: 'Văn bản',
        }

        console.log(`   📦 Tạo module mới: ${moduleKey}`)
        module = await prisma.module.create({
          data: {
            key: moduleKey,
            name: moduleNames[moduleKey] || moduleKey,
            description: `Module ${moduleNames[moduleKey] || moduleKey}`,
            enabled: true,
            version: '1.0.0',
          },
          select: {
            id: true,
            key: true,
            name: true,
            enabled: true,
          },
        })
        console.log(`   ✅ Đã tạo: ${module.name}`)
      } else {
        // Đảm bảo module được enable
        if (!module.enabled) {
          console.log(`   🔧 Đang bật module: ${module.name}`)
          await prisma.module.update({
            where: { id: module.id },
            data: { enabled: true },
          })
          module.enabled = true
          console.log(`   ✅ Đã bật: ${module.name}`)
        } else {
          console.log(`   ✅ Module đã tồn tại và đã bật: ${module.name}`)
        }
      }

      modules.push(module)
    }

    // 3. Cấp quyền truy cập cho từng giáo viên
    console.log(`\n🔐 Đang cấp quyền truy cập module cho ${teachers.length} giáo viên...`)

    let totalGranted = 0
    let totalUpdated = 0

    for (const teacher of teachers) {
      console.log(`\n👤 Xử lý cho: ${teacher.email}`)
      let grantedCount = 0
      let updatedCount = 0

      for (const module of modules) {
        try {
          // Kiểm tra xem đã có quyền chưa
          const existingAccess = await prisma.userModuleAccess.findUnique({
            where: {
              userId_moduleId: {
                userId: teacher.id,
                moduleId: module.id,
              },
            },
          })

          if (existingAccess) {
            // Cập nhật nếu đã tồn tại
            await prisma.userModuleAccess.update({
              where: {
                userId_moduleId: {
                  userId: teacher.id,
                  moduleId: module.id,
                },
              },
              data: {
                reason: 'TEACHER_ROLE_ACCESS',
                updatedAt: new Date(),
              },
            })
            updatedCount++
          } else {
            // Tạo mới nếu chưa có
            await prisma.userModuleAccess.create({
              data: {
                userId: teacher.id,
                moduleId: module.id,
                reason: 'TEACHER_ROLE_ACCESS',
              },
            })
            grantedCount++
          }
        } catch (error: any) {
          if (error.code === 'P2002') {
            // Đã tồn tại, bỏ qua
            updatedCount++
          } else {
            console.error(`   ⚠️  Lỗi khi cấp quyền module ${module.name}:`, error.message)
          }
        }
      }

      console.log(`   ✅ Đã cấp mới: ${grantedCount} module`)
      console.log(`   🔄 Đã cập nhật: ${updatedCount} module`)
      totalGranted += grantedCount
      totalUpdated += updatedCount
    }

    // 4. Tóm tắt
    console.log('\n' + '='.repeat(80))
    console.log('📊 TÓM TẮT:')
    console.log(`   👥 Số giáo viên: ${teachers.length}`)
    console.log(`   📦 Số module: ${modules.length}`)
    console.log(`   ✅ Module đã bật: ${modules.filter((m) => m.enabled).length}`)
    console.log(`   🔐 Quyền mới được cấp: ${totalGranted}`)
    console.log(`   🔄 Quyền đã cập nhật: ${totalUpdated}`)
    console.log('='.repeat(80))

    // 5. Kiểm tra lại
    console.log('\n🔍 Kiểm tra lại quyền truy cập...')
    for (const teacher of teachers) {
      const accessCount = await prisma.userModuleAccess.count({
        where: {
          userId: teacher.id,
          module: {
            key: { in: TEACHER_MODULES },
            enabled: true,
          },
        },
      })

      const accessibleModules = await prisma.userModuleAccess.findMany({
        where: {
          userId: teacher.id,
          module: {
            key: { in: TEACHER_MODULES },
          },
        },
        include: {
          module: {
            select: { key: true, name: true, enabled: true },
          },
        },
      })

      console.log(`\n   ${teacher.email}:`)
      console.log(`      - Số module có quyền: ${accessCount}/${TEACHER_MODULES.length}`)
      if (accessibleModules.length > 0) {
        accessibleModules.forEach((access) => {
          const status = access.module.enabled ? '✅' : '❌'
          console.log(`      ${status} ${access.module.name} (${access.module.key})`)
        })
      }
    }

    console.log('\n✅ Hoàn thành! Tất cả giáo viên đã được cấp quyền truy cập các module:')
    TEACHER_MODULES.forEach((key) => {
      console.log(`   - ${key}`)
    })
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

grantModulesToTeachers()
  .catch((error) => {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  })
