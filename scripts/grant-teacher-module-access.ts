import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function grantTeacherModuleAccess() {
    try {
        console.log('🚀 Bắt đầu cấp quyền module cho giáo viên...\n')

        // 1. Lấy hoặc tạo module "documents"
        let documentsModule = await prisma.module.findUnique({
            where: { key: 'documents' },
        })

        if (!documentsModule) {
            console.log('📄 Tạo module "documents"...')
            documentsModule = await prisma.module.create({
                data: {
                    key: 'documents',
                    name: 'Văn bản',
                    description: 'Quản lý văn bản',
                    enabled: true,
                    version: '1.0.0',
                },
            })
            console.log('✅ Đã tạo module "documents"')
        } else {
            console.log('✅ Module "documents" đã tồn tại')
            // Ensure it's enabled
            if (!documentsModule.enabled) {
                await prisma.module.update({
                    where: { id: documentsModule.id },
                    data: { enabled: true },
                })
                console.log('✅ Đã bật module "documents"')
            }
        }

        // 2. Lấy hoặc tạo module "spaces"
        let spacesModule = await prisma.module.findUnique({
            where: { key: 'spaces' },
        })

        if (!spacesModule) {
            console.log('🏢 Tạo module "spaces"...')
            spacesModule = await prisma.module.create({
                data: {
                    key: 'spaces',
                    name: 'Spaces',
                    description: 'Quản lý không gian làm việc',
                    enabled: true,
                    version: '1.0.0',
                },
            })
            console.log('✅ Đã tạo module "spaces"')
        } else {
            console.log('✅ Module "spaces" đã tồn tại')
            // Ensure it's enabled
            if (!spacesModule.enabled) {
                await prisma.module.update({
                    where: { id: spacesModule.id },
                    data: { enabled: true },
                })
                console.log('✅ Đã bật module "spaces"')
            }
        }

        // 3. Lấy tất cả giáo viên (TEACHER, TRUONG_TONG, QUAN_NHIEM)
        const teacherRoles = ['TEACHER', 'TRUONG_TONG', 'QUAN_NHIEM']
        const teachers = await prisma.user.findMany({
            where: {
                role: { in: teacherRoles },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        })

        console.log(`\n👥 Tìm thấy ${teachers.length} giáo viên:`)
        console.log(`   - Roles: ${teacherRoles.join(', ')}`)

        if (teachers.length === 0) {
            console.log('⚠️  Không có giáo viên nào trong hệ thống')
            return
        }

        // 4. Cấp quyền truy cập cho từng giáo viên
        let grantedCount = 0
        let skippedCount = 0

        for (const teacher of teachers) {
            const teacherName = `${teacher.firstName} ${teacher.lastName}`.trim() || teacher.email

            // Cấp quyền documents
            try {
                await prisma.userModuleAccess.upsert({
                    where: {
                        userId_moduleId: {
                            userId: teacher.id,
                            moduleId: documentsModule.id,
                        },
                    },
                    update: {
                        grantedAt: new Date(),
                        reason: 'ROLE_BASED',
                        updatedAt: new Date(),
                    },
                    create: {
                        userId: teacher.id,
                        moduleId: documentsModule.id,
                        reason: 'ROLE_BASED',
                    },
                })
                grantedCount++
            } catch (error) {
                console.error(`❌ Lỗi khi cấp quyền documents cho ${teacherName}:`, error)
                skippedCount++
            }

            // Cấp quyền spaces
            try {
                await prisma.userModuleAccess.upsert({
                    where: {
                        userId_moduleId: {
                            userId: teacher.id,
                            moduleId: spacesModule.id,
                        },
                    },
                    update: {
                        grantedAt: new Date(),
                        reason: 'ROLE_BASED',
                        updatedAt: new Date(),
                    },
                    create: {
                        userId: teacher.id,
                        moduleId: spacesModule.id,
                        reason: 'ROLE_BASED',
                    },
                })
                grantedCount++
            } catch (error) {
                console.error(`❌ Lỗi khi cấp quyền spaces cho ${teacherName}:`, error)
                skippedCount++
            }
        }

        console.log('\n✨ Hoàn thành!')
        console.log(`   - Tổng số giáo viên: ${teachers.length}`)
        console.log(`   - Tổng số quyền đã cấp: ${grantedCount}`)
        console.log(`   - Bỏ qua (đã tồn tại hoặc lỗi): ${skippedCount}`)
        console.log('\n📊 Chi tiết:')

        for (const teacher of teachers.slice(0, 5)) {
            const teacherName = `${teacher.firstName} ${teacher.lastName}`.trim() || teacher.email
            console.log(`   ✓ ${teacherName} (${teacher.role})`)
        }

        if (teachers.length > 5) {
            console.log(`   ... và ${teachers.length - 5} giáo viên khác`)
        }

    } catch (error) {
        console.error('❌ Lỗi:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

grantTeacherModuleAccess()
    .then(() => {
        console.log('\n✅ Script hoàn thành thành công!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Script thất bại:', error)
        process.exit(1)
    })
