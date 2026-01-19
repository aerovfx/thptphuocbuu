import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function grantAccess() {
    const targetModuleKeys = ['documents', 'spaces', 'social']
    const targetRoles = ['TEACHER', 'QUAN_NHIEM', 'TRUONG_TONG', 'BGH', 'BAN_TT', 'DOAN_TN', 'DANG_BO']

    try {
        console.log('🚀 Bắt đầu cấp quyền truy cập module cho giáo viên...')

        // 1. Tìm các module
        const modules = await prisma.module.findMany({
            where: {
                key: { in: targetModuleKeys },
                enabled: true
            }
        })

        if (modules.length === 0) {
            console.log('❌ Không tìm thấy module nào phù hợp.')
            return
        }

        console.log(`📦 Tìm thấy ${modules.length} modules: ${modules.map(m => m.key).join(', ')}`)

        // 2. Tìm tất cả giáo viên (bao gồm quản nhiệm và trưởng tổ)
        const teachers = await prisma.user.findMany({
            where: {
                role: { in: targetRoles as any }
            },
            select: {
                id: true,
                email: true,
                role: true
            }
        })

        if (teachers.length === 0) {
            console.log('❌ Không tìm thấy giáo viên nào.')
            return
        }

        console.log(`👨‍🏫 Tìm thấy ${teachers.length} giáo viên.`)

        // 3. Cấp quyền
        let grantCount = 0
        for (const teacher of teachers) {
            for (const module of modules) {
                await prisma.userModuleAccess.upsert({
                    where: {
                        userId_moduleId: {
                            userId: teacher.id,
                            moduleId: module.id
                        }
                    },
                    update: {
                        reason: 'AUTO_GRANT_TEACHER',
                        updatedAt: new Date()
                    },
                    create: {
                        userId: teacher.id,
                        moduleId: module.id,
                        reason: 'AUTO_GRANT_TEACHER'
                    }
                })
                grantCount++
            }
        }

        console.log(`✅ Đã cấp ${grantCount} quyền truy cập cho ${teachers.length} giáo viên.`)

    } catch (error) {
        console.error('❌ Lỗi:', error)
    } finally {
        await prisma.$disconnect()
    }
}

grantAccess()
