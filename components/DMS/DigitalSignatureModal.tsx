'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Loader2, CheckCircle, AlertCircle, Shield, Smartphone, QrCode } from 'lucide-react'
import { SignatureProvider } from '@prisma/client'
import Image from 'next/image'

interface DigitalSignatureModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  documentType: 'incoming' | 'outgoing' | 'document'
  onSuccess?: () => void
}

const providerLabels: Record<SignatureProvider, string> = {
  VNPT: 'VNPT Smart CA',
  VIETTEL: 'Viettel CA',
  MISA: 'MISA',
  INTERNAL: 'Ký nội bộ',
}

export default function DigitalSignatureModal({
  isOpen,
  onClose,
  documentId,
  documentType,
  onSuccess,
}: DigitalSignatureModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<SignatureProvider>('VNPT')
  const [signingReason, setSigningReason] = useState('')
  const [signingLocation, setSigningLocation] = useState('Việt Nam')
  const [otp, setOtp] = useState('')
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showExternalUpload, setShowExternalUpload] = useState(false)
  const [externalSignatureFile, setExternalSignatureFile] = useState<File | null>(null)
  const [externalCertificateInfo, setExternalCertificateInfo] = useState('')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [challengeCode, setChallengeCode] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isWaitingForApp, setIsWaitingForApp] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  if (!isOpen) return null

  const handleExternalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setExternalSignatureFile(file)
    }
  }

  const handleSign = async () => {
    setLoading(true)
    setError(null)

    try {
      // Handle external signature upload
      if (showExternalUpload && externalSignatureFile) {
        const reader = new FileReader()
        reader.onload = async (event) => {
          const base64 = event.target?.result as string
          const base64Data = base64.split(',')[1]

          const response = await fetch('/api/signature/sign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentId,
              documentType,
              provider: 'INTERNAL',
              signingReason: signingReason || undefined,
              signingLocation: signingLocation || undefined,
              externalSignatureFile: base64Data,
              externalCertificateInfo: externalCertificateInfo || JSON.stringify({
                subject: 'Chữ ký từ ứng dụng bên ngoài',
                organization: 'External',
              }),
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Lỗi khi tải lên chữ ký')
          }

          setSuccess(true)
          setTimeout(() => {
            onSuccess?.()
            onClose()
            resetForm()
          }, 2000)
        }
        reader.readAsDataURL(externalSignatureFile)
        return
      }

      // Normal signing flow
      const response = await fetch('/api/signature/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          documentType,
          provider: selectedProvider,
          signingReason: signingReason || undefined,
          signingLocation: signingLocation || undefined,
          otp: otp || undefined,
          transactionId: transactionId || undefined,
        }),
      })

      const data = await response.json()

      // VNPT SmartCA API Gateway - returns 202 with challenge code
      if (response.status === 202 && selectedProvider === 'VNPT' && data.transactionId && data.challengeCode) {
        setRequestId(data.transactionId)
        setChallengeCode(data.challengeCode)
        setQrCode(data.qrCode || null)
        setIsWaitingForApp(true)
        setError(null) // Clear error, show waiting message
        setLoading(false)
        
        // Start polling for status
        startPollingStatus(data.transactionId)
        return
      }

      if (!response.ok) {
        // Legacy OTP flow
        if (data.requiresOTP && data.transactionId) {
          setTransactionId(data.transactionId)
          setError('Vui lòng nhập mã OTP để xác nhận ký số')
          setLoading(false)
          return
        }
        throw new Error(data.error || 'Lỗi khi ký số')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
        resetForm()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Lỗi khi ký số')
    } finally {
      setLoading(false)
    }
  }

  const startPollingStatus = (requestId: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/smartca/status/${requestId}`)
        const data = await response.json()

        if (data.status === 'SIGNED') {
          // Signing completed
          clearInterval(interval)
          setPollingInterval(null)
          setIsWaitingForApp(false)
          setSuccess(true)
          
          setTimeout(() => {
            onSuccess?.()
            onClose()
            resetForm()
          }, 2000)
        } else if (data.status === 'FAILED' || data.status === 'EXPIRED') {
          // Signing failed
          clearInterval(interval)
          setPollingInterval(null)
          setIsWaitingForApp(false)
          setError(`Ký số thất bại: ${data.status === 'FAILED' ? 'Lỗi ký số' : 'Hết hạn'}`)
        }
        // Continue polling if status is PENDING
      } catch (error: any) {
        console.error('Error polling status:', error)
      }
    }, 2000) // Poll every 2 seconds

    setPollingInterval(interval)

    // Stop polling after 5 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval)
        setPollingInterval(null)
        setIsWaitingForApp(false)
        setError('Đã hết thời gian chờ xác nhận. Vui lòng thử lại.')
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const resetForm = () => {
    setSelectedProvider('VNPT')
    setSigningReason('')
    setSigningLocation('Việt Nam')
    setOtp('')
    setTransactionId(null)
    setRequestId(null)
    setChallengeCode(null)
    setQrCode(null)
    setIsWaitingForApp(false)
    setError(null)
    setSuccess(false)
    setShowExternalUpload(false)
    setExternalSignatureFile(null)
    setExternalCertificateInfo('')
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

  const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

  const [availableProviders, setAvailableProviders] = useState<SignatureProvider[]>(['VNPT', 'INTERNAL'])

  // Fetch available providers on mount
  useEffect(() => {
    // For now, use default providers
    // In production, fetch from API: /api/signature/providers
    setAvailableProviders(['VNPT', 'VIETTEL', 'MISA', 'INTERNAL'])
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-lg border border-gray-800 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-white font-poppins">Ký số văn bản</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center space-x-2 text-green-400">
            <CheckCircle size={20} />
            <span className="font-poppins">Ký số thành công!</span>
          </div>
        )}

        {/* Waiting for App Confirmation (VNPT SmartCA API Gateway) */}
        {isWaitingForApp && selectedProvider === 'VNPT' && (
          <div className="mb-6 p-6 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Smartphone className="text-blue-400 animate-pulse" size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-400 mb-2 font-poppins">
                  Đang chờ xác nhận từ ứng dụng VNPT SmartCA
                </h3>
                <p className="text-blue-300 mb-4 font-poppins">
                  Vui lòng mở ứng dụng VNPT SmartCA trên điện thoại và chọn "Ký tài liệu" để xác nhận.
                </p>
                {challengeCode && (
                  <div className="mb-4">
                    <p className="text-sm text-blue-300 mb-2 font-poppins">Mã Challenge:</p>
                    <p className="text-lg font-mono bg-blue-900/50 px-4 py-2 rounded-lg text-blue-200 font-poppins break-all">
                      {challengeCode}
                    </p>
                  </div>
                )}
                {qrCode && (
                  <div className="mb-4">
                    <p className="text-sm text-blue-300 mb-2 font-poppins">Quét mã QR để mở trong ứng dụng:</p>
                    <div className="bg-white p-2 rounded-lg inline-block">
                      <Image
                        src={qrCode}
                        alt="QR Code"
                        width={200}
                        height={200}
                        className="rounded"
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-blue-300 mt-4">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="font-poppins">Đang kiểm tra trạng thái ký số...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !isWaitingForApp && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-400">
            <AlertCircle size={20} />
            <span className="font-poppins">{error}</span>
          </div>
        )}

        {/* Form */}
        {!success && !isWaitingForApp && (
          <div className="space-y-4">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 font-poppins">
                Nhà cung cấp dịch vụ ký số
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as SignatureProvider)}
                disabled={loading || !!transactionId}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins disabled:opacity-50"
              >
                {availableProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {providerLabels[provider]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 font-poppins">
                {selectedProvider === 'VNPT' &&
                  'Sử dụng VNPT Smart CA để ký số từ xa, không cần USB Token'}
                {selectedProvider === 'INTERNAL' &&
                  'Ký số nội bộ (chỉ dùng cho mục đích nội bộ)'}
              </p>
            </div>

            {/* Signing Reason */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 font-poppins">
                Lý do ký số (tùy chọn)
              </label>
              <input
                type="text"
                value={signingReason}
                onChange={(e) => setSigningReason(e.target.value)}
                disabled={loading || !!transactionId}
                placeholder="Ví dụ: Phê duyệt văn bản"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins disabled:opacity-50"
              />
            </div>

            {/* Signing Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 font-poppins">
                Địa điểm ký số
              </label>
              <input
                type="text"
                value={signingLocation}
                onChange={(e) => setSigningLocation(e.target.value)}
                disabled={loading || !!transactionId}
                placeholder="Việt Nam"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins disabled:opacity-50"
              />
            </div>

            {/* OTP Input (if required) */}
            {transactionId && (
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 font-poppins">
                  Mã OTP <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                  placeholder="Nhập mã OTP từ SMS/Email"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                />
                <p className="mt-1 text-xs text-gray-500 font-poppins">
                  Mã OTP đã được gửi đến số điện thoại/email đã đăng ký
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-poppins font-semibold transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSign}
                disabled={loading || (transactionId && !otp) || (showExternalUpload && !externalSignatureFile)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-poppins font-semibold transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {loading && <Loader2 className="animate-spin" size={18} />}
                <span>
                  {showExternalUpload
                    ? 'Tải lên chữ ký'
                    : transactionId
                    ? 'Xác nhận ký số'
                    : 'Ký số'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

