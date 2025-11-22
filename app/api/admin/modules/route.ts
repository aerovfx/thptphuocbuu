import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Helper function to check admin permission
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required')
  }
  return session
}

// Helper function to create audit log
async function createAuditLog(
  actorId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  details: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        details: JSON.stringify(details),
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

// GET /api/admin/modules - List all modules
export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const enabled = searchParams.get('enabled')

    const where: any = {}
    if (enabled !== null) {
      where.enabled = enabled === 'true'
    }

    const modules = await prisma.module.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: modules })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching modules:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách module' },
      { status: 500 }
    )
  }
}

// POST /api/admin/modules - Create module
const createModuleSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  enabled: z.boolean().optional().default(false),
  config: z.string().optional(), // JSON string
  version: z.string().optional().default('1.0.0'),
})

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const body = await request.json()

    const validatedData = createModuleSchema.parse(body)

    // Check if module key already exists
    const existingModule = await prisma.module.findUnique({
      where: { key: validatedData.key.trim() },
    })

    if (existingModule) {
      return NextResponse.json(
        { error: 'Module key đã tồn tại' },
        { status: 400 }
      )
    }

    // Validate config is valid JSON if provided
    if (validatedData.config) {
      try {
        JSON.parse(validatedData.config)
      } catch {
        return NextResponse.json(
          { error: 'Config phải là JSON hợp lệ' },
          { status: 400 }
        )
      }
    }

    // Create module
    const module = await prisma.module.create({
      data: {
        key: validatedData.key.trim(),
        name: validatedData.name.trim(),
        description: validatedData.description?.trim(),
        enabled: validatedData.enabled,
        config: validatedData.config,
        version: validatedData.version,
      },
    })

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      'module.create',
      'module',
      module.id,
      { key: module.key, name: module.name, enabled: module.enabled },
      ipAddress,
      userAgent
    )

    return NextResponse.json(
      { message: 'Tạo module thành công', data: module },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error creating module:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo module' },
      { status: 500 }
    )
  }
}

