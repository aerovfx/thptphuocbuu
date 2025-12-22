import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

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
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

// GET /api/admin/users - List users with filters
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const session = await getServerSession(authOptions)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const role = searchParams.get('role')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (role && role !== 'ALL') {
      where.role = role
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true, // Will be null if column doesn't exist, we'll handle it
          avatar: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    // Map users to ensure status has a default value if null
    const usersWithStatus = users.map((user) => ({
      ...user,
      status: user.status || 'ACTIVE', // Default to ACTIVE if status is null
    }))

    return NextResponse.json({
      data: usersWithStatus,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách người dùng' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create user
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['STUDENT', 'TEACHER', 'PARENT', 'ADMIN']),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
})

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    
    // Pre-process and normalize data
    const preprocessedBody = {
      ...body,
      email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email,
      password: typeof body.password === 'string' ? body.password.trim() : body.password,
      firstName: typeof body.firstName === 'string' ? body.firstName.trim() : body.firstName,
      lastName: typeof body.lastName === 'string' ? body.lastName.trim() : body.lastName,
    }
    
    const validatedData = createUserSchema.parse(preprocessedBody)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        status: validatedData.status || 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      'user.create',
      'user',
      user.id,
      { email: user.email, role: user.role },
      ipAddress,
      userAgent
    )

    return NextResponse.json(
      { message: 'Tạo người dùng thành công', user },
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
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo người dùng' },
      { status: 500 }
    )
  }
}

