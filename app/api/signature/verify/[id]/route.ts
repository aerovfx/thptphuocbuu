import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { digitalSignatureService } from '@/lib/digital-signature/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const result = await digitalSignatureService.verifySignature(id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Verify signature error:', error)
    return NextResponse.json(
      { error: error.message || 'Lỗi khi xác thực' },
      { status: 500 }
    )
  }
}

