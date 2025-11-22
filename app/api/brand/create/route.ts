import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createBrandSchema = z.object({
  name: z.string().min(1, 'Tên thương hiệu là bắt buộc'),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  emailDomain: z.string().optional(),
  businessLicense: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is premium
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true, ownedBrand: true },
    })

    if (!user?.isPremium) {
      return NextResponse.json(
        { error: 'Bạn cần nâng cấp tài khoản Premium để tạo thương hiệu' },
        { status: 403 }
      )
    }

    // Check if user already has a brand
    if (user.ownedBrand) {
      return NextResponse.json(
        { error: 'Bạn đã có thương hiệu. Mỗi tài khoản chỉ được tạo một thương hiệu.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = createBrandSchema.parse(body)

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)

    // Check if slug already exists
    const existingBrand = await prisma.brand.findUnique({
      where: { slug },
    })

    if (existingBrand) {
      return NextResponse.json(
        { error: 'Tên thương hiệu đã được sử dụng. Vui lòng chọn tên khác.' },
        { status: 400 }
      )
    }

    // Create brand
    const brand = await prisma.brand.create({
      data: {
        name: validatedData.name,
        slug,
        website: validatedData.website || null,
        description: validatedData.description || null,
        emailDomain: validatedData.emailDomain || null,
        businessLicense: validatedData.businessLicense || null,
        logoUrl: validatedData.logoUrl || null,
        verificationStatus: 'PENDING',
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Note: brandId is automatically set via the relation

    // Create owner membership
    await prisma.brandMember.create({
      data: {
        brandId: brand.id,
        userId: session.user.id,
        role: 'OWNER',
      },
    })

    return NextResponse.json({
      brand,
      message: 'Đã tạo thương hiệu thành công. Đang chờ xác minh...',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating brand:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo thương hiệu' },
      { status: 500 }
    )
  }
}

