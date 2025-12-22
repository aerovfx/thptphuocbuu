/**
 * Digital Signature Service
 * 
 * Service layer để tích hợp với các nhà cung cấp ký số
 */

import { SignatureProvider } from '@prisma/client'
import { vnptSmartCAService } from './vnpt-smartca'
import { getProviderConfig } from './config'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'

export interface SignDocumentRequest {
  documentId: string
  documentType: 'incoming' | 'outgoing' | 'document'
  provider: SignatureProvider
  signerId: string
  signingReason?: string
  signingLocation?: string
  otp?: string
  transactionId?: string
  externalSignatureFile?: string // Base64 encoded file for external signature upload
  externalCertificateInfo?: string // JSON string for external certificate info
}

export interface SignDocumentResponse {
  success: boolean
  signatureId?: string
  transactionId?: string
  signedFileUrl?: string
  signatureHash?: string
  error?: string
  requiresOTP?: boolean
  challengeCode?: string // VNPT SmartCA challenge code
  qrCode?: string // QR code để scan trong app
}

export class DigitalSignatureService {
  /**
   * Sign document using specified provider
   */
  async signDocument(request: SignDocumentRequest): Promise<SignDocumentResponse> {
    try {
      // Get document based on type
      let document: any = null
      
      if (request.documentType === 'incoming') {
        document = await prisma.incomingDocument.findUnique({
          where: { id: request.documentId },
        })
      } else if (request.documentType === 'outgoing') {
        document = await prisma.outgoingDocument.findUnique({
          where: { id: request.documentId },
        })
      } else if (request.documentType === 'document') {
        document = await prisma.document.findUnique({
          where: { id: request.documentId },
        })
      }

      if (!document) {
        return {
          success: false,
          error: 'Không tìm thấy văn bản',
        }
      }

      if (!document.fileUrl) {
        return {
          success: false,
          error: 'Văn bản chưa có file đính kèm',
        }
      }

      // Get signer info
      const signer = await prisma.user.findUnique({
        where: { id: request.signerId },
      })

      if (!signer) {
        return {
          success: false,
          error: 'Không tìm thấy người ký',
        }
      }

      // Read file content
      const filePath = join(process.cwd(), 'public', document.fileUrl)
      let fileContent: Buffer
      try {
        fileContent = await readFile(filePath)
      } catch (error) {
        return {
          success: false,
          error: 'Không thể đọc file văn bản',
        }
      }

      // Handle external signature upload
      if (request.externalSignatureFile && request.externalCertificateInfo) {
        return await this.saveExternalSignature({
          document,
          fileContent,
          signer,
          request,
        })
      }

      // Route to appropriate provider
      switch (request.provider) {
        case 'VNPT':
          return await this.signWithVNPT({
            document,
            fileContent,
            signer,
            request,
          })

        case 'VIETTEL':
        case 'MISA':
          // TODO: Implement other providers
          return {
            success: false,
            error: `Nhà cung cấp ${request.provider} chưa được tích hợp`,
          }

        case 'INTERNAL':
          return await this.signInternal({
            document,
            fileContent,
            signer,
            request,
          })

        default:
          return {
            success: false,
            error: 'Nhà cung cấp không hợp lệ',
          }
      }
    } catch (error: any) {
      console.error('Digital signature error:', error)
      return {
        success: false,
        error: error.message || 'Lỗi khi ký số',
      }
    }
  }

  /**
   * Sign with VNPT Smart CA
   */
  private async signWithVNPT(params: {
    document: any
    fileContent: Buffer
    signer: any
    request: SignDocumentRequest
  }): Promise<SignDocumentResponse> {
    const { document, fileContent, signer, request } = params

    // If transactionId exists, confirm the transaction
    if (request.transactionId) {
      const confirmResult = await vnptSmartCAService.confirmTransaction(
        request.transactionId,
        request.otp
      )

      if (!confirmResult.success) {
        return {
          success: false,
          error: confirmResult.error,
        }
      }

      // Save signature to database
      const signatureData: any = {
        provider: 'VNPT',
        certificateId: confirmResult.certificateInfo?.serial,
        certificateInfo: JSON.stringify(confirmResult.certificateInfo),
        signedBy: `${signer.firstName} ${signer.lastName}`,
        signedById: signer.id,
        signatureHash: confirmResult.signatureHash,
        signatureFileUrl: confirmResult.signedFileUrl,
        timestamp: new Date(),
        isValid: true,
      }

      if (request.documentType === 'outgoing') {
        signatureData.outgoingDocumentId = document.id
      }
      // Note: Incoming documents signature support can be added if needed

      const signature = await prisma.digitalSignature.create({
        data: signatureData,
      })

      // Update document with signed file
      if (request.documentType === 'outgoing') {
        await prisma.outgoingDocument.update({
          where: { id: document.id },
          data: { signedFileUrl: confirmResult.signedFileUrl },
        })
      }

      return {
        success: true,
        signatureId: signature.id,
        signedFileUrl: confirmResult.signedFileUrl,
        signatureHash: confirmResult.signatureHash,
      }
    }

    // Calculate PDF hash (SHA256)
    const crypto = require('crypto')
    const hash = crypto.createHash('sha256')
    hash.update(fileContent)
    const documentHash = hash.digest('hex')

    // Get callback URL
    const callbackUrl = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/smartca/callback`
      : undefined

    // Create signing request via API Gateway
    const challengeResponse = await vnptSmartCAService.createSigningRequest({
      documentId: document.id,
      documentContent: fileContent,
      documentHash,
      fileName: document.fileName || 'document.pdf',
      signerInfo: {
        userId: signer.id,
        email: signer.email,
        phone: signer.phone || undefined,
      },
      signingReason: request.signingReason,
      signingLocation: request.signingLocation,
      callbackUrl,
    })

    if (!challengeResponse.success) {
      return {
        success: false,
        error: challengeResponse.error,
      }
    }

    // Return challenge code and request ID
    // Frontend will poll for status or wait for callback
    return {
      success: false, // Not completed yet
      requiresOTP: false,
      transactionId: challengeResponse.requestId, // Use requestId as transactionId
      challengeCode: challengeResponse.challengeCode,
      qrCode: challengeResponse.qrCode,
      error: challengeResponse.message || 'Vui lòng mở ứng dụng VNPT SmartCA để xác nhận ký số',
    }
  }

  /**
   * Internal signing (simple hash-based)
   */
  private async signInternal(params: {
    document: any
    fileContent: Buffer
    signer: any
    request: SignDocumentRequest
  }): Promise<SignDocumentResponse> {
    const { document, fileContent, signer, request } = params

    // Simple internal signing using hash
    const crypto = require('crypto')
    const hash = crypto.createHash('sha256')
    hash.update(fileContent)
    hash.update(signer.id)
    hash.update(new Date().toISOString())
    const signatureHash = hash.digest('hex')

    // Save signature
    const signatureData: any = {
      provider: 'INTERNAL',
      signedBy: `${signer.firstName} ${signer.lastName}`,
      signedById: signer.id,
      signatureHash,
      timestamp: new Date(),
      isValid: true,
      certificateInfo: JSON.stringify({
        subject: `${signer.firstName} ${signer.lastName}`,
        email: signer.email,
        organization: 'Nội bộ',
      }),
    }

    if (request.documentType === 'outgoing') {
      signatureData.outgoingDocumentId = document.id
    } else if (request.documentType === 'document') {
      signatureData.documentId = document.id
    }
    // Note: Incoming documents signature support can be added if needed

    const signature = await prisma.digitalSignature.create({
      data: signatureData,
    })

    return {
      success: true,
      signatureId: signature.id,
      signatureHash,
    }
  }

  /**
   * Save external signature (uploaded from external app)
   */
  private async saveExternalSignature(params: {
    document: any
    fileContent: Buffer
    signer: any
    request: SignDocumentRequest
  }): Promise<SignDocumentResponse> {
    const { document, signer, request } = params

    if (!request.externalSignatureFile || !request.externalCertificateInfo) {
      return {
        success: false,
        error: 'Thiếu thông tin chữ ký từ bên ngoài',
      }
    }

    try {
      // Parse certificate info
      const certificateInfo = JSON.parse(request.externalCertificateInfo)

      // Save external signature file
      const fs = require('fs').promises
      const path = require('path')
      const crypto = require('crypto')

      // Generate hash for signature
      const hash = crypto.createHash('sha256')
      hash.update(request.externalSignatureFile)
      const signatureHash = hash.digest('hex')

      // Save signature file
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'signatures')
      await fs.mkdir(uploadDir, { recursive: true })
      
      const signatureFileName = `signature_${document.id}_${Date.now()}.pdf`
      const signatureFilePath = path.join(uploadDir, signatureFileName)
      const signatureFileBuffer = Buffer.from(request.externalSignatureFile, 'base64')
      await fs.writeFile(signatureFilePath, signatureFileBuffer)
      
      const signatureFileUrl = `/uploads/signatures/${signatureFileName}`

      // Save signature to database
      const signatureData: any = {
        provider: 'INTERNAL', // Mark as external/internal
        certificateId: certificateInfo.serial || certificateInfo.certificateId,
        certificateInfo: request.externalCertificateInfo,
        signedBy: certificateInfo.subject || `${signer.firstName} ${signer.lastName}`,
        signedById: signer.id,
        signatureHash,
        signatureFileUrl,
        timestamp: new Date(),
        isValid: true,
      }

      if (request.documentType === 'outgoing') {
        signatureData.outgoingDocumentId = document.id
      } else if (request.documentType === 'document') {
        signatureData.documentId = document.id
      }

      const signature = await prisma.digitalSignature.create({
        data: signatureData,
      })

      // Update document with signed file
      if (request.documentType === 'outgoing') {
        await prisma.outgoingDocument.update({
          where: { id: document.id },
          data: { signedFileUrl: signatureFileUrl },
        })
      } else if (request.documentType === 'document') {
        await prisma.document.update({
          where: { id: document.id },
          data: { signedFileUrl: signatureFileUrl },
        })
      }

      return {
        success: true,
        signatureId: signature.id,
        signedFileUrl: signatureFileUrl,
        signatureHash,
      }
    } catch (error: any) {
      console.error('Save external signature error:', error)
      return {
        success: false,
        error: error.message || 'Lỗi khi lưu chữ ký từ bên ngoài',
      }
    }
  }

  /**
   * Verify signature
   */
  async verifySignature(signatureId: string): Promise<{
    valid: boolean
    certificateInfo?: any
    error?: string
  }> {
    try {
      const signature = await prisma.digitalSignature.findUnique({
        where: { id: signatureId },
      })

      if (!signature) {
        return {
          valid: false,
          error: 'Không tìm thấy chữ ký',
        }
      }

      // Route to appropriate provider
      switch (signature.provider) {
        case 'VNPT':
          if (signature.signatureFileUrl) {
            return await vnptSmartCAService.verifySignature(
              signature.signatureFileUrl,
              signature.signatureHash || undefined
            )
          }
          break

        case 'INTERNAL':
          // Internal verification is always valid if exists
          return {
            valid: signature.isValid,
            certificateInfo: signature.certificateInfo
              ? JSON.parse(signature.certificateInfo)
              : null,
          }

        default:
          return {
            valid: false,
            error: 'Nhà cung cấp chưa hỗ trợ xác thực',
          }
      }

      return {
        valid: false,
        error: 'Không thể xác thực chữ ký',
      }
    } catch (error: any) {
      console.error('Verify signature error:', error)
      return {
        valid: false,
        error: error.message || 'Lỗi khi xác thực',
      }
    }
  }
}

export const digitalSignatureService = new DigitalSignatureService()

