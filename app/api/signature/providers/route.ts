import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEnabledProviders } from '@/lib/digital-signature/config'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const providers = getEnabledProviders().map((p) => ({
      name: p.name,
      enabled: p.enabled,
    }))

    return NextResponse.json({ providers })
  } catch (error: any) {
    console.error('Get providers error:', error)
    return NextResponse.json(
      { error: error.message || 'Lỗi khi lấy danh sách nhà cung cấp' },
      { status: 500 }
    )
  }
}

