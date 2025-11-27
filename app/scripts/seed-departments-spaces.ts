/**
 * Script to seed departments and spaces for the school organizational structure
 * Based on the comprehensive organizational structure document
 */

import { PrismaClient, SpaceType, SpaceVisibility, DepartmentType } from '@prisma/client'

const prisma = new PrismaClient()

async function seedDepartmentsAndSpaces() {
  try {
    console.log('🌱 Bắt đầu seed departments và spaces...\n')

    // 1. Tạo School Hub (parent space)
    const schoolHub = await prisma.space.upsert({
      where: { code: 'SCHOOL_HUB' },
      update: {},
      create: {
        name: 'School Hub',
        code: 'SCHOOL_HUB',
        description: 'Không gian công khai chung của trường',
        type: SpaceType.SCHOOL_HUB,
        visibility: SpaceVisibility.PUBLIC,
        icon: 'school',
        color: '#3B82F6',
        order: 0,
      },
    })
    console.log('✅ Đã tạo School Hub')

    // 2. Tạo BGH Space
    const bghSpace = await prisma.space.upsert({
      where: { code: 'BGH_SPACE' },
      update: {},
      create: {
        name: 'Ban Giám Hiệu',
        code: 'BGH_SPACE',
        description: 'Không gian riêng của Ban Giám Hiệu',
        type: SpaceType.BGH_SPACE,
        visibility: SpaceVisibility.PRIVATE,
        parentId: schoolHub.id,
        icon: 'shield',
        color: '#EF4444',
        order: 1,
      },
    })
    console.log('✅ Đã tạo BGH Space')

    // 3. Tạo Ban Truyền Thông Space
    const banTTSpace = await prisma.space.upsert({
      where: { code: 'BAN_TT_SPACE' },
      update: {},
      create: {
        name: 'Ban Truyền Thông',
        code: 'BAN_TT_SPACE',
        description: 'Không gian làm việc của Ban Truyền Thông',
        type: SpaceType.BAN_TT,
        visibility: SpaceVisibility.INTERNAL,
        parentId: schoolHub.id,
        icon: 'megaphone',
        color: '#10B981',
        order: 2,
      },
    })
    console.log('✅ Đã tạo Ban Truyền Thông Space')

    // 4. Tạo Tổ Hành chính Space
    const toHanhChinhSpace = await prisma.space.upsert({
      where: { code: 'TO_HANH_CHINH_SPACE' },
      update: {},
      create: {
        name: 'Tổ Hành chính',
        code: 'TO_HANH_CHINH_SPACE',
        description: 'Không gian làm việc của Tổ Hành chính',
        type: SpaceType.TO_HANH_CHINH,
        visibility: SpaceVisibility.INTERNAL,
        parentId: schoolHub.id,
        icon: 'briefcase',
        color: '#F59E0B',
        order: 3,
      },
    })
    console.log('✅ Đã tạo Tổ Hành chính Space')

    // 5. Tạo Bảo vệ Space
    const baoVeSpace = await prisma.space.upsert({
      where: { code: 'BAO_VE_SPACE' },
      update: {},
      create: {
        name: 'Bảo vệ',
        code: 'BAO_VE_SPACE',
        description: 'Không gian làm việc của Bảo vệ',
        type: SpaceType.BAO_VE,
        visibility: SpaceVisibility.INTERNAL,
        parentId: toHanhChinhSpace.id,
        icon: 'shield-check',
        color: '#8B5CF6',
        order: 1,
      },
    })
    console.log('✅ Đã tạo Bảo vệ Space')

    // 6. Tạo Lao công Space
    const laoCongSpace = await prisma.space.upsert({
      where: { code: 'LAO_CONG_SPACE' },
      update: {},
      create: {
        name: 'Lao công',
        code: 'LAO_CONG_SPACE',
        description: 'Không gian làm việc của Lao công',
        type: SpaceType.LAO_CONG,
        visibility: SpaceVisibility.INTERNAL,
        parentId: toHanhChinhSpace.id,
        icon: 'wrench',
        color: '#06B6D4',
        order: 2,
      },
    })
    console.log('✅ Đã tạo Lao công Space')

    // 7. Tạo Đoàn/Đảng bộ Space
    const doanDangSpace = await prisma.space.upsert({
      where: { code: 'DOAN_DANG_SPACE' },
      update: {},
      create: {
        name: 'Đoàn Thanh Niên / Đảng bộ',
        code: 'DOAN_DANG_SPACE',
        description: 'Không gian hoạt động của Đoàn và Đảng bộ',
        type: SpaceType.DOAN_DANG,
        visibility: SpaceVisibility.INTERNAL,
        parentId: schoolHub.id,
        icon: 'flag',
        color: '#DC2626',
        order: 4,
      },
    })
    console.log('✅ Đã tạo Đoàn/Đảng bộ Space')

    // 8. Tạo Ban Tài chính Space
    const taiChinhSpace = await prisma.space.upsert({
      where: { code: 'TAI_CHINH_SPACE' },
      update: {},
      create: {
        name: 'Ban Tài chính / Kế toán',
        code: 'TAI_CHINH_SPACE',
        description: 'Không gian làm việc của Ban Tài chính',
        type: SpaceType.TAI_CHINH,
        visibility: SpaceVisibility.PRIVATE,
        parentId: schoolHub.id,
        icon: 'dollar-sign',
        color: '#059669',
        order: 5,
      },
    })
    console.log('✅ Đã tạo Ban Tài chính Space')

    // 9. Tạo Ban Y tế Space
    const yTeSpace = await prisma.space.upsert({
      where: { code: 'Y_TE_SPACE' },
      update: {},
      create: {
        name: 'Ban Y tế / Hỗ trợ',
        code: 'Y_TE_SPACE',
        description: 'Không gian làm việc của Ban Y tế',
        type: SpaceType.Y_TE,
        visibility: SpaceVisibility.INTERNAL,
        parentId: schoolHub.id,
        icon: 'heart',
        color: '#EC4899',
        order: 6,
      },
    })
    console.log('✅ Đã tạo Ban Y tế Space')

    // 10. Tạo Public News Space
    const publicNewsSpace = await prisma.space.upsert({
      where: { code: 'PUBLIC_NEWS_SPACE' },
      update: {},
      create: {
        name: 'Tin tức công khai / Gallery',
        code: 'PUBLIC_NEWS_SPACE',
        description: 'Không gian công khai cho tin tức và gallery',
        type: SpaceType.PUBLIC_NEWS,
        visibility: SpaceVisibility.PUBLIC,
        parentId: schoolHub.id,
        icon: 'newspaper',
        color: '#6366F1',
        order: 7,
      },
    })
    console.log('✅ Đã tạo Public News Space')

    // 10.5. Tạo Space Văn bản
    const vanBanSpace = await prisma.space.upsert({
      where: { code: 'VAN_BAN_SPACE' },
      update: {},
      create: {
        name: 'Văn bản',
        code: 'VAN_BAN_SPACE',
        description: 'Không gian quản lý văn bản DMS',
        type: SpaceType.SCHOOL_HUB,
        visibility: SpaceVisibility.INTERNAL,
        parentId: schoolHub.id,
        icon: 'file-text',
        color: '#6366F1',
        order: 7.5,
      },
    })
    console.log('✅ Đã tạo Space Văn bản')

    // 11. Tạo các Tổ Chuyên Môn
    const toChuyenMonSubjects = [
      { name: 'Tổ Toán', code: 'TO_TOAN', subject: 'Toán', color: '#3B82F6', icon: 'calculator' },
      { name: 'Tổ Văn', code: 'TO_VAN', subject: 'Văn', color: '#10B981', icon: 'book-open' },
      { name: 'Tổ Lý', code: 'TO_LY', subject: 'Vật Lý', color: '#F59E0B', icon: 'atom' },
      { name: 'Tổ Hóa', code: 'TO_HOA', subject: 'Hóa học', color: '#EF4444', icon: 'flask' },
      { name: 'Tổ Sinh', code: 'TO_SINH', subject: 'Sinh học', color: '#8B5CF6', icon: 'dna' },
      { name: 'Tổ Sử', code: 'TO_SU', subject: 'Lịch sử', color: '#EC4899', icon: 'landmark' },
      { name: 'Tổ Địa', code: 'TO_DIA', subject: 'Địa lý', color: '#06B6D4', icon: 'globe' },
      { name: 'Tổ Anh', code: 'TO_ANH', subject: 'Tiếng Anh', color: '#6366F1', icon: 'languages' },
      { name: 'Tổ GDCD', code: 'TO_GDCD', subject: 'Giáo dục công dân', color: '#14B8A6', icon: 'users' },
      { name: 'Tổ Thể dục', code: 'TO_THE_DUC', subject: 'Thể dục', color: '#F97316', icon: 'dumbbell' },
      { name: 'Tổ Tin học', code: 'TO_TIN', subject: 'Tin học', color: '#8B5CF6', icon: 'laptop' },
      { name: 'Tổ Mỹ thuật', code: 'TO_MY_THUAT', subject: 'Mỹ thuật', color: '#EC4899', icon: 'palette' },
      { name: 'Tổ Âm nhạc', code: 'TO_AM_NHAC', subject: 'Âm nhạc', color: '#F59E0B', icon: 'music' },
    ]

    // Tạo Space cho Tổ Chuyên Môn (parent)
    const toChuyenMonSpace = await prisma.space.upsert({
      where: { code: 'TO_CHUYEN_MON_SPACE' },
      update: {},
      create: {
        name: 'Tổ Chuyên Môn',
        code: 'TO_CHUYEN_MON_SPACE',
        description: 'Không gian chung cho các Tổ Chuyên Môn',
        type: SpaceType.TO_CHUYEN_MON,
        visibility: SpaceVisibility.INTERNAL,
        parentId: schoolHub.id,
        icon: 'users',
        color: '#6366F1',
        order: 8,
      },
    })
    console.log('✅ Đã tạo Tổ Chuyên Môn Space (parent)')

    // Tạo các tổ chuyên môn
    const departments = []
    for (let i = 0; i < toChuyenMonSubjects.length; i++) {
      const subject = toChuyenMonSubjects[i]
      
      // Tạo space cho từng tổ
      const subjectSpace = await prisma.space.upsert({
        where: { code: `${subject.code}_SPACE` },
        update: {},
        create: {
          name: subject.name,
          code: `${subject.code}_SPACE`,
          description: `Không gian làm việc của ${subject.name}`,
          type: SpaceType.TO_CHUYEN_MON,
          visibility: SpaceVisibility.PRIVATE,
          parentId: toChuyenMonSpace.id,
          icon: subject.icon,
          color: subject.color,
          order: i + 1,
        },
      })

      // Tạo department
      const department = await prisma.department.upsert({
        where: { code: subject.code },
        update: {},
        create: {
          name: subject.name,
          code: subject.code,
          description: `Tổ chuyên môn ${subject.name}`,
          type: DepartmentType.TO_CHUYEN_MON,
          spaceId: subjectSpace.id,
          subject: subject.subject,
          icon: subject.icon,
          color: subject.color,
          order: i + 1,
        },
      })
      
      departments.push(department)
      console.log(`✅ Đã tạo ${subject.name}`)
    }

    // 12. Tạo các departments khác
    const otherDepartments = [
      {
        name: 'Tổ Hành chính',
        code: 'TO_HANH_CHINH_DEPT',
        type: DepartmentType.TO_HANH_CHINH,
        spaceId: toHanhChinhSpace.id,
        icon: 'briefcase',
        color: '#F59E0B',
      },
      {
        name: 'Ban Truyền Thông',
        code: 'BAN_TT_DEPT',
        type: DepartmentType.BAN_TT,
        spaceId: banTTSpace.id,
        icon: 'megaphone',
        color: '#10B981',
      },
      {
        name: 'Ban Tài chính',
        code: 'BAN_TAI_CHINH_DEPT',
        type: DepartmentType.BAN_TAI_CHINH,
        spaceId: taiChinhSpace.id,
        icon: 'dollar-sign',
        color: '#059669',
      },
      {
        name: 'Ban Y tế',
        code: 'BAN_Y_TE_DEPT',
        type: DepartmentType.BAN_Y_TE,
        spaceId: yTeSpace.id,
        icon: 'heart',
        color: '#EC4899',
      },
      {
        name: 'Đoàn Thanh Niên / Đảng bộ',
        code: 'DOAN_DANG_DEPT',
        type: DepartmentType.DOAN_DANG,
        spaceId: doanDangSpace.id,
        icon: 'flag',
        color: '#DC2626',
      },
    ]

    for (const dept of otherDepartments) {
      await prisma.department.upsert({
        where: { code: dept.code },
        update: {},
        create: {
          name: dept.name,
          code: dept.code,
          description: `Bộ phận ${dept.name}`,
          type: dept.type,
          spaceId: dept.spaceId,
          icon: dept.icon,
          color: dept.color,
        },
      })
      console.log(`✅ Đã tạo ${dept.name}`)
    }

    console.log('\n🎉 Hoàn thành seed departments và spaces!')
    console.log(`\n📊 Tóm tắt:`)
    console.log(`   - Spaces: ${await prisma.space.count()}`)
    console.log(`   - Departments: ${await prisma.department.count()}`)
  } catch (error: any) {
    console.error('❌ Lỗi khi seed:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedDepartmentsAndSpaces()

