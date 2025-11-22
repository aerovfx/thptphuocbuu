import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const verifyBrandSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
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

    // Only ADMIN can verify brands
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ quản trị viên mới có thể xác minh thương hiệu' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = verifyBrandSchema.parse(body)

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id },
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

    if (!brand) {
      return NextResponse.json({ error: 'Thương hiệu không tồn tại' }, { status: 404 })
    }

    // Update verification status
    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: {
        verificationStatus: validatedData.status,
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

    // If approved, assign default badge to owner
    if (validatedData.status === 'APPROVED') {
      // Check if badge already exists
      const existingBadge = await prisma.brandBadge.findUnique({
        where: {
          brandId_userId: {
            brandId: id,
            userId: brand.createdById,
          },
        },
      })

      if (!existingBadge) {
        await prisma.brandBadge.create({
          data: {
            brandId: id,
            userId: brand.createdById,
            badgeType: 'GOLD', // Default to GOLD for verified organizations
            isActive: true,
          },
        })
      }
    }

    return NextResponse.json({
      brand: updatedBrand,
      message: `Thương hiệu đã được ${validatedData.status === 'APPROVED' ? 'xác minh' : 'từ chối'}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error verifying brand:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xác minh thương hiệu' },
      { status: 500 }
    )
  }
}

