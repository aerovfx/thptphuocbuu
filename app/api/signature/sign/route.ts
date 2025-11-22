import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { digitalSignatureService } from '@/lib/digital-signature/service'
import { SignatureProvider } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      documentId,
      documentType,
      provider,
      signingReason,
      signingLocation,
      otp,
      transactionId,
    } = body

    // Validate input
    if (!documentId || !documentType || !provider) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    if (!['incoming', 'outgoing', 'document'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Loại văn bản không hợp lệ' },
        { status: 400 }
      )
    }

    if (!Object.values(SignatureProvider).includes(provider)) {
      return NextResponse.json(
        { error: 'Nhà cung cấp không hợp lệ' },
        { status: 400 }
      )
    }

    // Sign document
    const result = await digitalSignatureService.signDocument({
      documentId,
      documentType,
      provider,
      signerId: session.user.id,
      signingReason,
      signingLocation,
      otp,
      transactionId,
    })

    if (!result.success) {
      // VNPT SmartCA API Gateway returns challenge code
      if (provider === 'VNPT' && result.transactionId && result.challengeCode) {
        return NextResponse.json(
          {
            error: result.error || 'Vui lòng mở ứng dụng VNPT SmartCA để xác nhận ký số',
            transactionId: result.transactionId,
            challengeCode: result.challengeCode,
            qrCode: result.qrCode,
            requiresOTP: false,
          },
          { status: 202 } // Accepted - waiting for app confirmation
        )
      }

      return NextResponse.json(
        {
          error: result.error,
          requiresOTP: result.requiresOTP,
          transactionId: result.transactionId,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      signatureId: result.signatureId,
      signedFileUrl: result.signedFileUrl,
      signatureHash: result.signatureHash,
    })
  } catch (error: any) {
    console.error('Sign document error:', error)
    return NextResponse.json(
      { error: error.message || 'Lỗi khi ký số' },
      { status: 500 }
    )
  }
}

