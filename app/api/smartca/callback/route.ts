import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { vnptSmartCAService } from '@/lib/digital-signature/vnpt-smartca'
import { embedSignatureToPDF } from '@/lib/digital-signature/pdf-signature'

/**
 * Callback endpoint từ VNPT SmartCA
 * SmartCA sẽ gọi endpoint này khi người dùng đã ký số trong app
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      requestId,
      documentId,
      signature, // Base64 encoded signature
      certificateInfo,
      timestamp,
      status, // SIGNED, FAILED, EXPIRED
    } = body

    // Validate callback data
    if (!requestId || !documentId || !signature) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Find document by requestId (stored in signature request)
    // Or find by documentId
    let document = null
    let documentType: 'incoming' | 'outgoing' | 'document' = 'outgoing'

    // Try to find outgoing document first
    document = await prisma.outgoingDocument.findUnique({
      where: { id: documentId },
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

    if (document) {
      documentType = 'outgoing'
    } else {
      // Try general document
      document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })
      if (document) {
        documentType = 'document'
      }
    }

    if (!document) {
      return NextResponse.json(
        { error: 'Không tìm thấy văn bản' },
        { status: 404 }
      )
    }

    if (status !== 'SIGNED') {
      return NextResponse.json(
        { error: `Trạng thái ký số không hợp lệ: ${status}` },
        { status: 400 }
      )
    }

    if (!document.fileUrl) {
      return NextResponse.json(
        { error: 'Văn bản chưa có file đính kèm' },
        { status: 400 }
      )
    }

    // Get signer info from certificate or document creator
    const signer = (document as any).createdBy || (document as any).uploadedBy
    if (!signer) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin người ký' },
        { status: 404 }
      )
    }

    // Embed signature into PDF
    const { readFile } = await import('fs/promises')
    const { join } = await import('path')
    
    const filePath = join(process.cwd(), 'public', document.fileUrl)
    const originalPdfBuffer = await readFile(filePath)

    // Embed signature into PDF (PAdES format)
    const signedPdfBuffer = await embedSignatureToPDF({
      originalPdf: originalPdfBuffer,
      signature: Buffer.from(signature, 'base64'),
      certificateInfo: certificateInfo,
      signerName: `${signer.firstName} ${signer.lastName}`,
      signingReason: 'Ký số văn bản',
      signingLocation: 'Việt Nam',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    })

    // Save signed PDF
    const { writeFile } = await import('fs/promises')
    const { mkdir } = await import('fs/promises')
    const crypto = await import('crypto')

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'signatures')
    await mkdir(uploadDir, { recursive: true })

    const signedFileName = `signed_${documentId}_${Date.now()}.pdf`
    const signedFilePath = join(uploadDir, signedFileName)
    await writeFile(signedFilePath, signedPdfBuffer)
    
    const signedFileUrl = `/uploads/signatures/${signedFileName}`

    // Calculate signature hash
    const hash = crypto.createHash('sha256')
    hash.update(signedPdfBuffer)
    const signatureHash = hash.digest('hex')

    // Save signature to database
    const signatureData: any = {
      provider: 'VNPT',
      certificateId: certificateInfo?.serial || certificateInfo?.certificateId,
      certificateInfo: JSON.stringify(certificateInfo),
      signedBy: `${signer.firstName} ${signer.lastName}`,
      signedById: signer.id,
      signatureHash,
      signatureFileUrl: signedFileUrl,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      isValid: true,
    }

    if (documentType === 'outgoing') {
      signatureData.outgoingDocumentId = document.id
    } else if (documentType === 'document') {
      signatureData.documentId = document.id
    }

    const signatureRecord = await prisma.digitalSignature.create({
      data: signatureData,
    })

    // Update document with signed file
    if (documentType === 'outgoing') {
      await prisma.outgoingDocument.update({
        where: { id: document.id },
        data: { signedFileUrl },
      })
    } else if (documentType === 'document') {
      await prisma.document.update({
        where: { id: document.id },
        data: { signedFileUrl },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Đã nhận chữ ký số thành công',
      signatureId: signatureRecord.id,
      signedFileUrl,
    })
  } catch (error: any) {
    // Use logger instead of console.error for production safety
    if (process.env.NODE_ENV === 'development') {
      console.error('SmartCA callback error:', error)
    }
    return NextResponse.json(
      { 
        error: 'Lỗi khi xử lý callback từ SmartCA',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

