/**
 * VNPT Smart CA Integration
 * 
 * Tích hợp với VNPT Smart CA API Gateway để ký số
 * Quy trình:
 * 1. DMS gửi yêu cầu ký (hash PDF) → SmartCA tạo mã challenge
 * 2. Người dùng ký bằng app VNPT SmartCA → SmartCA trả về chữ ký số
 * 3. DMS nhận chữ ký và nhúng vào PDF
 * 
 * Tài liệu: https://doitac-smartca.vnpt.vn/help/document/
 */

import { CA_PROVIDERS } from './config'
import { calculateHashFromBuffer } from './pdf-hash'

interface VNPTSignRequest {
  documentId: string
  documentContent: string | Buffer
  fileName: string
  documentHash?: string // SHA256 hash of PDF
  signerInfo: {
    userId: string
    email: string
    phone?: string
    certificateSerial?: string
  }
  signingReason?: string
  signingLocation?: string
  callbackUrl?: string
}

interface VNPTChallengeResponse {
  success: boolean
  requestId?: string
  challengeCode?: string
  qrCode?: string // QR code để scan trong app
  message?: string
  error?: string
}

interface VNPTStatusResponse {
  success: boolean
  status?: 'PENDING' | 'SIGNED' | 'FAILED' | 'EXPIRED'
  requestId?: string
  error?: string
}

interface VNPTResultResponse {
  success: boolean
  requestId?: string
  signature?: string // Base64 encoded signature
  certificateInfo?: {
    serial: string
    issuer: string
    validFrom: Date
    validTo: Date
    subject: string
  }
  timestamp?: Date
  error?: string
}

interface VNPTSignResponse {
  success: boolean
  transactionId?: string
  signedFileUrl?: string
  signatureHash?: string
  certificateInfo?: {
    serial: string
    issuer: string
    validFrom: Date
    validTo: Date
    subject: string
  }
  error?: string
}

export class VNPTSmartCAService {
  private config = CA_PROVIDERS.VNPT

  /**
   * Create signing request via API Gateway
   * Gửi hash PDF và nhận challenge code
   */
  async createSigningRequest(request: VNPTSignRequest): Promise<VNPTChallengeResponse> {
    if (!this.config.enabled || !this.config.apiKey) {
      return {
        success: false,
        error: 'VNPT Smart CA chưa được cấu hình',
      }
    }

    try {
      // Calculate PDF hash if not provided
      let documentHash = request.documentHash
      if (!documentHash && request.documentContent) {
        const buffer = typeof request.documentContent === 'string'
          ? Buffer.from(request.documentContent, 'base64')
          : request.documentContent
        documentHash = calculateHashFromBuffer(buffer)
      }

      if (!documentHash) {
        return {
          success: false,
          error: 'Không thể tính hash của file PDF',
        }
      }

      const response = await fetch(
        `${this.config.apiBaseUrl}${this.config.endpoints.createTransaction}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-Key': this.config.apiKey || '',
          },
          body: JSON.stringify({
            documentId: request.documentId,
            documentHash, // SHA256 hash của PDF
            fileName: request.fileName,
            signerInfo: {
              userId: request.signerInfo.userId,
              email: request.signerInfo.email,
              phone: request.signerInfo.phone,
            },
            signingReason: request.signingReason || 'Ký số văn bản',
            signingLocation: request.signingLocation || 'Việt Nam',
            callbackUrl: request.callbackUrl || this.config.callbackUrl, // URL để SmartCA gọi lại khi ký xong
            requestId: `${request.documentId}-${Date.now()}`, // Unique request ID
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.message || 'Lỗi khi tạo yêu cầu ký số',
        }
      }

      const data = await response.json()

      return {
        success: true,
        requestId: data.requestId,
        challengeCode: data.challengeCode,
        qrCode: data.qrCode, // QR code để scan trong app
        message: data.message || 'Vui lòng mở ứng dụng VNPT SmartCA để xác nhận ký số',
      }
    } catch (error: any) {
      console.error('VNPT Smart CA create signing request error:', error)
      return {
        success: false,
        error: error.message || 'Lỗi khi tạo yêu cầu ký số',
      }
    }
  }

  /**
   * Get signing status
   * Kiểm tra trạng thái ký số
   */
  async getSigningStatus(requestId: string): Promise<VNPTStatusResponse> {
    if (!this.config.enabled || !this.config.apiKey) {
      return {
        success: false,
        error: 'VNPT Smart CA chưa được cấu hình',
      }
    }

    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}${this.config.endpoints.getStatus}?requestId=${requestId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-Key': this.config.apiKey || '',
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.message || 'Lỗi khi kiểm tra trạng thái',
        }
      }

      const data = await response.json()

      return {
        success: true,
        status: data.status, // PENDING, SIGNED, FAILED, EXPIRED
        requestId: data.requestId,
      }
    } catch (error: any) {
      console.error('VNPT Smart CA get status error:', error)
      return {
        success: false,
        error: error.message || 'Lỗi khi kiểm tra trạng thái',
      }
    }
  }

  /**
   * Get signing result
   * Nhận chữ ký số sau khi người dùng đã ký trong app
   */
  async getSigningResult(requestId: string): Promise<VNPTResultResponse> {
    if (!this.config.enabled || !this.config.apiKey) {
      return {
        success: false,
        error: 'VNPT Smart CA chưa được cấu hình',
      }
    }

    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}${this.config.endpoints.getResult}?requestId=${requestId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-Key': this.config.apiKey || '',
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.message || 'Lỗi khi lấy kết quả ký số',
        }
      }

      const data = await response.json()

      return {
        success: true,
        requestId: data.requestId,
        signature: data.signature, // Base64 encoded signature
        certificateInfo: data.certificateInfo,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      }
    } catch (error: any) {
      console.error('VNPT Smart CA get result error:', error)
      return {
        success: false,
        error: error.message || 'Lỗi khi lấy kết quả ký số',
      }
    }
  }

  /**
   * Create signing transaction (Legacy method - kept for backward compatibility)
   */
  async createTransaction(request: VNPTSignRequest): Promise<VNPTSignResponse> {
    // Use new API Gateway method
    const challengeResponse = await this.createSigningRequest(request)
    
    if (!challengeResponse.success) {
      return {
        success: false,
        error: challengeResponse.error,
      }
    }

    return {
      ...challengeResponse,
      transactionId: challengeResponse.requestId,
    }
  }

  /**
   * Confirm and complete signing transaction
   */
  async confirmTransaction(
    transactionId: string,
    otp?: string
  ): Promise<VNPTSignResponse> {
    if (!this.config.enabled || !this.config.apiKey) {
      throw new Error('VNPT Smart CA chưa được cấu hình')
    }

    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}${this.config.endpoints.confirmTransaction}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-Key': this.config.apiKey || '',
          },
          body: JSON.stringify({
            transactionId,
            otp,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Lỗi khi xác nhận ký số')
      }

      const data = await response.json()

      return {
        success: true,
        signedFileUrl: data.signedFileUrl,
        signatureHash: data.signatureHash,
        certificateInfo: data.certificateInfo,
      }
    } catch (error: any) {
      console.error('VNPT Smart CA confirm transaction error:', error)
      return {
        success: false,
        error: error.message || 'Lỗi khi xác nhận ký số',
      }
    }
  }

  /**
   * Verify signature
   */
  async verifySignature(
    signedFileUrl: string,
    signatureHash?: string
  ): Promise<{ valid: boolean; certificateInfo?: any; error?: string }> {
    if (!this.config.enabled || !this.config.apiKey) {
      throw new Error('VNPT Smart CA chưa được cấu hình')
    }

    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}${this.config.endpoints.verify}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-Key': this.config.apiKey || '',
          },
          body: JSON.stringify({
            signedFileUrl,
            signatureHash,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Lỗi khi xác thực chữ ký')
      }

      const data = await response.json()

      return {
        valid: data.valid === true,
        certificateInfo: data.certificateInfo,
      }
    } catch (error: any) {
      console.error('VNPT Smart CA verify error:', error)
      return {
        valid: false,
        error: error.message || 'Lỗi khi xác thực chữ ký',
      }
    }
  }

  /**
   * Get certificate information
   */
  async getCertificate(certificateSerial: string): Promise<any> {
    if (!this.config.enabled || !this.config.apiKey) {
      throw new Error('VNPT Smart CA chưa được cấu hình')
    }

    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}${this.config.endpoints.getCertificate}/${certificateSerial}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-Key': this.config.apiKey || '',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Không thể lấy thông tin chứng chỉ')
      }

      return await response.json()
    } catch (error: any) {
      console.error('VNPT Smart CA get certificate error:', error)
      throw error
    }
  }
}

export const vnptSmartCAService = new VNPTSmartCAService()

