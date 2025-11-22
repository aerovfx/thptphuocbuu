import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { vnptSmartCAService } from '@/lib/digital-signature/vnpt-smartca'

/**
 * API endpoint để kiểm tra trạng thái ký số
 * Frontend sẽ polling endpoint này để biết khi nào ký số hoàn tất
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await params

    if (!requestId) {
      return NextResponse.json(
        { error: 'Thiếu requestId' },
        { status: 400 }
      )
    }

    // Check signing status
    const statusResponse = await vnptSmartCAService.getSigningStatus(requestId)

    if (!statusResponse.success) {
      return NextResponse.json(
        { error: statusResponse.error },
        { status: 400 }
      )
    }

    // If status is SIGNED, get the result
    if (statusResponse.status === 'SIGNED') {
      const resultResponse = await vnptSmartCAService.getSigningResult(requestId)
      
      if (resultResponse.success) {
        return NextResponse.json({
          status: 'SIGNED',
          requestId: resultResponse.requestId,
          signature: resultResponse.signature,
          certificateInfo: resultResponse.certificateInfo,
          timestamp: resultResponse.timestamp,
        })
      }
    }

    return NextResponse.json({
      status: statusResponse.status, // PENDING, SIGNED, FAILED, EXPIRED
      requestId: statusResponse.requestId,
    })
  } catch (error: any) {
    console.error('Error checking signing status:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi kiểm tra trạng thái ký số', details: error.message },
      { status: 500 }
    )
  }
}

