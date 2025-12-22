import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user has permission to manage this space
    const space = await prisma.space.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    const canManage = isAdmin || space.members.some((m) => m.canManage)

    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if Scrum workflow already exists
    const existingWorkflow = await prisma.spaceWorkflow.findFirst({
      where: {
        spaceId: id,
        type: 'SCRUM',
        isActive: true,
      },
    })

    if (existingWorkflow) {
      return NextResponse.json(
        { error: 'Scrum workflow already exists for this space' },
        { status: 400 }
      )
    }

    // Apply Scrum template
    // 1. Update space framework to SCRUM
    await prisma.space.update({
      where: { id },
      data: {
        framework: 'SCRUM',
        sprintDuration: 14, // Default 2 weeks
      },
    })

    // 2. Create Scrum workflow
    const scrumSteps = [
      {
        id: '1',
        name: 'Sprint Planning',
        order: 1,
        description: 'Lập kế hoạch sprint, xác định user stories và story points',
      },
      {
        id: '2',
        name: 'Daily Standup',
        order: 2,
        description: 'Họp standup hàng ngày để cập nhật tiến độ',
      },
      {
        id: '3',
        name: 'Sprint Review',
        order: 3,
        description: 'Review kết quả sprint với stakeholders',
      },
      {
        id: '4',
        name: 'Sprint Retrospective',
        order: 4,
        description: 'Rút kinh nghiệm và cải thiện quy trình',
      },
    ]

    const scrumWorkflow = await prisma.spaceWorkflow.create({
      data: {
        spaceId: id,
        name: 'Scrum Workflow',
        type: 'SCRUM',
        description: 'Quy trình làm việc theo mô hình Scrum với các sprint 2 tuần',
        steps: JSON.stringify(scrumSteps),
        sprintDuration: 14,
        dailyStandupTime: '09:00',
        sprintPlanningDay: 'Monday',
        retrospectiveDay: 'Friday',
        isActive: true,
        order: 0,
      },
    })

    // 3. Create default Scrum rules
    const scrumRules = [
      {
        title: 'Daily Standup',
        description: 'Họp standup hàng ngày lúc 09:00, mỗi người trình bày: Đã làm gì? Sẽ làm gì? Có khó khăn gì?',
        category: 'COMMUNICATION',
        content: `## Daily Standup Rules

- **Thời gian**: 09:00 hàng ngày
- **Thời lượng**: Tối đa 15 phút
- **Nội dung**: Mỗi thành viên trình bày:
  1. Đã làm gì hôm qua?
  2. Sẽ làm gì hôm nay?
  3. Có khó khăn/blocker nào không?

- **Quy tắc**:
  - Không được giải quyết vấn đề trong standup
  - Nếu có blocker, hẹn họp riêng sau standup
  - Tập trung vào công việc, không lan man`,
        isRequired: true,
        priority: 'HIGH',
      },
      {
        title: 'Sprint Planning',
        description: 'Lập kế hoạch sprint vào đầu mỗi sprint, ước lượng story points cho các user stories',
        category: 'MEETING',
        content: `## Sprint Planning Rules

- **Thời gian**: Đầu sprint (thứ 2)
- **Mục tiêu**: 
  - Xác định user stories cho sprint
  - Ước lượng story points
  - Phân công công việc

- **Quy tắc**:
  - Chỉ chọn user stories đã được refine
  - Ước lượng theo Fibonacci (1, 2, 3, 5, 8, 13)
  - Không commit quá nhiều công việc`,
        isRequired: true,
        priority: 'HIGH',
      },
      {
        title: 'Definition of Done',
        description: 'Tiêu chí hoàn thành cho mỗi task/user story',
        category: 'CODE_REVIEW',
        content: `## Definition of Done

Một task được coi là "Done" khi:
- Code đã được review và approve
- Unit tests đã pass
- Documentation đã được cập nhật
- Đã được test trên môi trường staging
- Không còn bug critical`,
        isRequired: true,
        priority: 'NORMAL',
      },
    ]

    for (const rule of scrumRules) {
      await prisma.spaceRule.create({
        data: {
          spaceId: id,
          title: rule.title,
          description: rule.description,
          category: rule.category,
          content: rule.content,
          isRequired: rule.isRequired,
          priority: rule.priority,
          isActive: true,
          order: 0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Scrum template đã được áp dụng thành công',
      workflow: scrumWorkflow,
    })
  } catch (error: any) {
    console.error('Error applying Scrum template:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to apply Scrum template' },
      { status: 500 }
    )
  }
}

