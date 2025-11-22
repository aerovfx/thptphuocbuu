import { NextResponse } from 'next/server'
import { checkAndExpirePremiumSubscriptions } from '@/lib/premium/auto-activate'

/**
 * API endpoint to check and expire premium subscriptions
 * This should be called periodically (cron job or on user actions)
 */
export async function POST() {
  try {
    const result = await checkAndExpirePremiumSubscriptions()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error checking premium expiry:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi kiểm tra hết hạn Premium', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Also support GET for easier cron job calls
 */
export async function GET() {
  return POST()
}

