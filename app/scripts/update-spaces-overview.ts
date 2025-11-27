import { prisma } from '@/lib/prisma'

interface SpaceOverviewData {
  mission?: string
  members?: Array<{
    name: string
    role: string
    userId?: string
    avatar?: string | null
  }>
  workflow?: Array<{
    step: number
    title: string
    description?: string
  }>
  tools?: Array<{
    name: string
    link?: string
    description?: string
  }>
  timelines?: Array<{
    type: string
    schedule: string
    description?: string
  }>
  rules?: string[]
  kpis?: Array<{
    metric: string
    target?: string
    current?: string
  }>
  resources?: Array<{
    name: string
    link: string
    type?: string
  }>
  security?: string[]
  activityLog?: Array<{
    date: string
    completed: string[]
    inProgress: string[]
    upcoming: string[]
  }>
}

// Template overview mặc định
function getDefaultOverview(spaceName: string, spaceType: string): SpaceOverviewData {
  return {
    mission: `Space ${spaceName} được tạo ra để quản lý và điều phối các hoạt động liên quan đến ${spaceType}. Space này phụ trách việc tổ chức, theo dõi và đảm bảo các mục tiêu được thực hiện đúng tiến độ và chất lượng.`,
    workflow: [
      {
        step: 1,
        title: 'Nhận yêu cầu',
        description: 'Tiếp nhận và phân tích yêu cầu từ các bên liên quan',
      },
      {
        step: 2,
        title: 'Lên kế hoạch / Phê duyệt',
        description: 'Xây dựng kế hoạch chi tiết và trình phê duyệt',
      },
      {
        step: 3,
        title: 'Thực thi',
        description: 'Triển khai các công việc theo kế hoạch đã được phê duyệt',
      },
      {
        step: 4,
        title: 'Kiểm duyệt',
        description: 'Kiểm tra và đánh giá chất lượng công việc',
      },
      {
        step: 5,
        title: 'Xuất bản / Bàn giao',
        description: 'Hoàn thiện và bàn giao kết quả',
      },
      {
        step: 6,
        title: 'Lưu trữ',
        description: 'Lưu trữ tài liệu và báo cáo vào hệ thống DMS',
      },
    ],
    tools: [
      {
        name: 'DMS - Hệ thống quản lý văn bản',
        link: '/dashboard/dms',
        description: 'Quản lý và theo dõi văn bản đến/đi',
      },
      {
        name: 'Google Drive',
        link: 'https://drive.google.com',
        description: 'Lưu trữ và chia sẻ tài liệu',
      },
    ],
    timelines: [
      {
        type: 'Họp định kỳ',
        schedule: 'Hàng tuần vào thứ 2, 14:00',
        description: 'Họp đánh giá tiến độ và lên kế hoạch tuần mới',
      },
      {
        type: 'Báo cáo tiến độ',
        schedule: 'Cuối tuần (Chủ nhật)',
        description: 'Báo cáo tổng kết công việc trong tuần',
      },
    ],
    rules: [
      'Nhắn tin công việc cần tag đúng người phụ trách',
      'Không spam tin nhắn vào nhiều nhóm',
      'Mọi file phải lưu vào thư mục chuẩn trên Google Drive',
      'Báo cáo tiến độ trước khi hết ngày làm việc',
      'Cập nhật trạng thái công việc trên Scrum Board thường xuyên',
    ],
    kpis: [
      {
        metric: 'Tỷ lệ hoàn thành deadline',
        target: '≥ 90%',
        current: '0%',
      },
      {
        metric: 'Số công việc hoàn thành',
        target: 'Theo kế hoạch',
        current: '0',
      },
    ],
    resources: [
      {
        name: 'Template báo cáo',
        link: '/dashboard/dms',
        type: 'Template',
      },
      {
        name: 'Quy chế làm việc',
        link: '/dashboard',
        type: 'Quy chế',
      },
    ],
    security: [
      'Nội dung nội bộ không được chia sẻ ra ngoài Space',
      'Chỉ thành viên Space và Admin được phép xem thông tin',
      'Cần phê duyệt từ Leader trước khi xuất bản nội dung công khai',
    ],
  }
}

async function updateSpacesOverview() {
  try {
    console.log('🚀 Bắt đầu cập nhật overview cho tất cả spaces...\n')

    // Lấy tất cả spaces
    const spacesRaw = await prisma.$queryRaw<Array<{
      id: string
      name: string
      type: string
    }>>`
      SELECT id, name, type
      FROM spaces
      WHERE "isActive" = 1
      ORDER BY "createdAt" ASC
    `

    // Lấy overview và members cho mỗi space
    const spaces = await Promise.all(
      spacesRaw.map(async (space) => {
        // Lấy overview bằng cách update trực tiếp (sẽ null nếu chưa có)
        let overview: string | null = null
        try {
          const result = await prisma.$queryRaw<Array<{ overview: string | null }>>`
            SELECT overview FROM spaces WHERE id = ${space.id}
          `
          overview = result[0]?.overview || null
        } catch (e) {
          // Nếu cột chưa tồn tại, overview sẽ là null
          overview = null
        }

        const members = await prisma.spaceMember.findMany({
          where: { spaceId: space.id },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        })
        return {
          id: space.id,
          name: space.name,
          type: space.type,
          overview,
          members,
        }
      })
    )

    console.log(`📊 Tìm thấy ${spaces.length} spaces\n`)

    let updated = 0
    let skipped = 0
    let errors = 0

    for (const space of spaces) {
      try {
        // Chỉ cập nhật nếu chưa có overview
        if (space.overview) {
          console.log(`⏭️  Bỏ qua "${space.name}" - đã có overview`)
          skipped++
          continue
        }

        // Tạo overview mặc định
        const defaultOverview = getDefaultOverview(space.name, space.type)

        // Thêm members từ space vào overview
        if (space.members && space.members.length > 0) {
          defaultOverview.members = space.members.map((member) => ({
            name: `${member.user.firstName} ${member.user.lastName}`,
            role: member.role || (member.canManage ? 'Quản lý' : 'Thành viên'),
            userId: member.user.id,
            avatar: member.user.avatar,
          }))
        }

        // Cập nhật overview
        await prisma.space.update({
          where: { id: space.id },
          data: {
            overview: JSON.stringify(defaultOverview),
          },
        })

        console.log(`✅ Đã cập nhật overview cho "${space.name}"`)
        updated++
      } catch (error: any) {
        console.error(`❌ Lỗi khi cập nhật "${space.name}":`, error.message)
        errors++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📈 Kết quả:')
    console.log(`   ✅ Đã cập nhật: ${updated} spaces`)
    console.log(`   ⏭️  Đã bỏ qua: ${skipped} spaces (đã có overview)`)
    console.log(`   ❌ Lỗi: ${errors} spaces`)
    console.log('='.repeat(50))
  } catch (error) {
    console.error('❌ Lỗi khi chạy script:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Chạy script
if (require.main === module) {
  updateSpacesOverview()
    .then(() => {
      console.log('\n✨ Hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Script thất bại:', error)
      process.exit(1)
    })
}

export default updateSpacesOverview

