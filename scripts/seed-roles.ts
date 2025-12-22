import { PrismaClient } from '@prisma/client'
import { prisma } from '../lib/prisma'

const userRoles = [
  { name: 'admin', description: 'Quản trị viên - Toàn quyền quản lý hệ thống' },
  { name: 'giáo viên', description: 'Giáo viên - Quản lý lớp học và học sinh' },
  { name: 'phụ huynh', description: 'Phụ huynh - Theo dõi tiến độ học tập của con' },
  { name: 'huynh.huynh.vào', description: 'Vai trò đặc biệt' },
  { name: 'ADMIN', description: 'Quản trị viên - Toàn quyền quản lý hệ thống' },
  { name: 'TEACHER', description: 'Giáo viên - Quản lý lớp học và học sinh' },
  { name: 'STUDENT', description: 'Học sinh - Truy cập lớp học và tài liệu' },
  { name: 'PARENT', description: 'Phụ huynh - Theo dõi tiến độ học tập của con' },
  { name: 'SUPER_ADMIN', description: 'Quản trị hệ thống - Quyền cao nhất' },
  { name: 'BGH', description: 'Ban Giám Hiệu - Quản lý và phê duyệt' },
  { name: 'BAN_TT', description: 'Ban Truyền Thông - Quản lý nội dung truyền thông' },
  { name: 'TRUONG_TONG', description: 'Trưởng Tổ - Quản lý tổ chuyên môn' },
  { name: 'QUAN_NHIEM', description: 'Quản nhiệm - Giáo viên chủ nhiệm' },
  { name: 'TRUONG_HANH_CHINH', description: 'Trưởng Hành chính - Quản lý hành chính' },
  { name: 'BAO_VE', description: 'Bảo vệ - An ninh trường học' },
  { name: 'LAO_CONG', description: 'Lao công - Vệ sinh và bảo trì' },
  { name: 'DOAN_TN', description: 'Đoàn Thanh Niên - Tổ chức hoạt động đoàn' },
  { name: 'DANG_BO', description: 'Đảng bộ - Quản lý hoạt động đảng' },
  { name: 'TAI_CHINH', description: 'Tài chính - Quản lý tài chính và kế toán' },
  { name: 'Y_TE', description: 'Y tế - Chăm sóc sức khỏe học sinh' },
]

async function seedRoles() {
  try {
    console.log('🌱 Bắt đầu seed roles...')

    // Get first admin user to use as creator
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    })

    if (!adminUser) {
      console.error('❌ Không tìm thấy user ADMIN để tạo roles')
      return
    }

    let createdCount = 0
    let updatedCount = 0

    for (const roleData of userRoles) {
      try {
        const existingRole = await prisma.role.findUnique({
          where: { name: roleData.name },
        })

        if (existingRole) {
          // Update existing role
          await prisma.role.update({
            where: { id: existingRole.id },
            data: {
              description: roleData.description,
            },
          })
          updatedCount++
          console.log(`✅ Cập nhật role: ${roleData.name}`)
        } else {
          // Create new role
          await prisma.role.create({
            data: {
              name: roleData.name,
              description: roleData.description,
              createdById: adminUser.id,
            },
          })
          createdCount++
          console.log(`✅ Tạo role: ${roleData.name}`)
        }
      } catch (error: any) {
        console.error(`❌ Lỗi khi xử lý role ${roleData.name}:`, error.message)
      }
    }

    console.log(`\n✅ Hoàn thành! Đã tạo ${createdCount} roles mới, cập nhật ${updatedCount} roles`)
  } catch (error) {
    console.error('❌ Lỗi khi seed roles:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedRoles()
  .then(() => {
    console.log('✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })

