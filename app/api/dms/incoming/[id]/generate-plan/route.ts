import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const planRequestSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
})

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
    const body = await request.json()
    const validatedData = planRequestSchema.parse(body)

    // Get document details
    const document = await prisma.incomingDocument.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        type: true,
        priority: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    // Use document content or provided content
    const contentToAnalyze = validatedData.content || document.content || document.summary || ''
    const titleToUse = validatedData.title || document.title

    // Generate plan based on document type and content
    const planItems = generatePlanFromContent(titleToUse, contentToAnalyze, document.type, document.priority)

    return NextResponse.json({ items: planItems })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error generating plan:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo kế hoạch' },
      { status: 500 }
    )
  }
}

function generatePlanFromContent(
  title: string,
  content: string,
  type: string,
  priority: string
): string[] {
  const items: string[] = []

  // Base items for all documents
  items.push('Đọc và nghiên cứu nội dung văn bản')
  items.push('Xác định các yêu cầu và nhiệm vụ chính')

  // Type-specific items
  switch (type) {
    case 'DECISION':
      items.push('Phân tích quyết định và tác động')
      items.push('Xác định các bên liên quan cần thông báo')
      items.push('Lập kế hoạch triển khai quyết định')
      items.push('Theo dõi tiến độ thực hiện')
      break

    case 'DIRECTIVE':
      items.push('Nghiên cứu chỉ thị và yêu cầu')
      items.push('Xác định các đơn vị/bộ phận liên quan')
      items.push('Lập kế hoạch thực hiện chi tiết')
      items.push('Phân công nhiệm vụ cụ thể')
      items.push('Báo cáo kết quả thực hiện')
      break

    case 'REPORT':
      items.push('Thu thập dữ liệu và thông tin cần thiết')
      items.push('Phân tích và xử lý dữ liệu')
      items.push('Soạn thảo báo cáo')
      items.push('Rà soát và chỉnh sửa báo cáo')
      items.push('Trình duyệt và phê duyệt')
      break

    case 'REQUEST':
      items.push('Xác định yêu cầu và mục tiêu')
      items.push('Đánh giá khả năng đáp ứng')
      items.push('Lập phương án xử lý')
      items.push('Thực hiện yêu cầu')
      items.push('Phản hồi kết quả')
      break

    case 'NOTIFICATION':
      items.push('Xác định đối tượng cần thông báo')
      items.push('Chuẩn bị nội dung thông báo')
      items.push('Gửi thông báo đến các bên liên quan')
      items.push('Xác nhận đã nhận thông báo')
      break

    default:
      items.push('Phân tích nội dung chi tiết')
      items.push('Xác định các hành động cần thực hiện')
      items.push('Lập kế hoạch xử lý')
      items.push('Thực hiện các bước đã lập')
      items.push('Kiểm tra và hoàn thiện')
  }

  // Priority-based items
  if (priority === 'URGENT' || priority === 'HIGH') {
    items.push('Ưu tiên xử lý khẩn cấp')
    items.push('Báo cáo tiến độ định kỳ')
  }

  // Content-based extraction (simple keyword matching)
  const contentLower = content.toLowerCase()
  
  if (contentLower.includes('phê duyệt') || contentLower.includes('duyệt')) {
    items.push('Chuẩn bị hồ sơ phê duyệt')
    items.push('Trình lãnh đạo phê duyệt')
  }

  if (contentLower.includes('ký') || contentLower.includes('chữ ký')) {
    items.push('Chuẩn bị tài liệu ký')
    items.push('Trình ký theo quy trình')
  }

  if (contentLower.includes('họp') || contentLower.includes('hội nghị')) {
    items.push('Chuẩn bị nội dung cuộc họp')
    items.push('Mời các bên liên quan')
    items.push('Tổ chức cuộc họp')
    items.push('Biên bản và kết luận')
  }

  if (contentLower.includes('báo cáo') || contentLower.includes('báo cáo')) {
    items.push('Thu thập thông tin báo cáo')
    items.push('Soạn thảo báo cáo')
  }

  // Final items
  items.push('Kiểm tra lại toàn bộ quy trình')
  items.push('Hoàn tất và lưu trữ hồ sơ')

  // Remove duplicates and return
  return Array.from(new Set(items))
}

