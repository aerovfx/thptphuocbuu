import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { checkAndActivatePremium } from '@/lib/premium/auto-activate'

/**
 * API endpoint to manually trigger premium activation check
 * This can be called after completing a task or on demand
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await checkAndActivatePremium(session.user.id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in auto-activate premium:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi kiểm tra kích hoạt Premium', details: error.message },
      { status: 500 }
    )
  }
}

