import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can delete all spaces
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa tất cả spaces' },
        { status: 403 }
      )
    }

    // Get all spaces first to count
    const allSpaces = await prisma.space.findMany({
      select: { id: true },
    })

    // Delete all spaces (cascade will handle related data)
    await prisma.space.deleteMany({})

    return NextResponse.json({
      message: `Đã xóa thành công ${allSpaces.length} space(s)`,
      deletedCount: allSpaces.length,
    })
  } catch (error) {
    console.error('Error deleting all spaces:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa spaces' },
      { status: 500 }
    )
  }
}

