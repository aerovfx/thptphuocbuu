'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Download,
  Eye,
  PenTool,
  Shield,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import Avatar from '@/components/Common/Avatar'
import PDFViewer from './PDFViewer'
import DigitalSignatureModal from './DigitalSignatureModal'

interface Document {
  id: string
  title: string
  description?: string | null
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  type: string
  category?: string | null
  signedFileUrl?: string | null
  createdAt: string
  uploadedBy: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
  }
  signatures?: Array<{
    id: string
    provider: string
    signedBy: string
    signedByUser: {
      id: string
      firstName: string
      lastName: string
      avatar?: string | null
    }
    timestamp: string
    isValid: boolean
    certificateInfo?: string | null
  }>
}

interface DocumentDetailProps {
  document: Document
  currentUser: {
    id: string
    role: string
    firstName: string
    lastName: string
  }
}

const providerLabels: Record<string, string> = {
  VNPT: 'VNPT Smart CA',
  VIETTEL: 'Viettel CA',
  FPT: 'FPT CA',
  MISA: 'MISA',
  INTERNAL: 'Ký nội bộ',
}

export default function DocumentDetail({ document, currentUser }: DocumentDetailProps) {
  const router = useRouter()
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)

  const isPDF = document.fileUrl?.toLowerCase().endsWith('.pdf') || document.mimeType === 'application/pdf'
  const canSign = currentUser.role === 'ADMIN' || currentUser.role === 'TEACHER' || document.uploadedBy.id === currentUser.id
  const hasSignature = document.signatures && document.signatures.length > 0

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleDownload = () => {
    const link = window.document.createElement('a')
    link.href = document.signedFileUrl || document.fileUrl
    link.download = document.fileName
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-poppins mb-2">{document.title}</h1>
        {document.description && (
          <p className="text-gray-400 font-poppins">{document.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 mb-6">
        {isPDF && (
          <button
            onClick={() => setShowPDFViewer(true)}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
            title="Xem PDF"
          >
            <FileText size={20} />
          </button>
        )}
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
          title="Xem file"
        >
          <Eye size={20} />
        </a>
        <button
          onClick={handleDownload}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
          title="Tải xuống"
        >
          <Download size={20} />
        </button>
        {canSign && (
          <button
            onClick={() => setShowSignatureModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2"
          >
            <PenTool size={18} />
            <span>Ký số</span>
          </button>
        )}
      </div>

      {/* Document Info */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 font-poppins">Thông tin tài liệu</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <FileText className="text-gray-400" size={18} />
            <div>
              <p className="text-xs text-gray-500 font-poppins">Tên file</p>
              <p className="text-white font-poppins">{document.fileName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="text-gray-400" size={18} />
            <div>
              <p className="text-xs text-gray-500 font-poppins">Kích thước</p>
              <p className="text-white font-poppins">{formatFileSize(document.fileSize)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <User className="text-gray-400" size={18} />
            <div>
              <p className="text-xs text-gray-500 font-poppins">Người tải lên</p>
              <div className="flex items-center space-x-2">
                <Avatar
                  src={document.uploadedBy.avatar}
                  name={`${document.uploadedBy.firstName} ${document.uploadedBy.lastName}`}
                  size="sm"
                  userId={document.uploadedBy.id}
                  clickable={true}
                />
                <span className="text-white font-poppins">
                  {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="text-gray-400" size={18} />
            <div>
              <p className="text-xs text-gray-500 font-poppins">Ngày tải lên</p>
              <p className="text-white font-poppins">
                {formatDistanceToNow(new Date(document.createdAt), {
                  addSuffix: true,
                  locale: vi,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Signatures */}
      {hasSignature && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 font-poppins flex items-center space-x-2">
            <Shield size={20} />
            <span>Chữ ký số</span>
          </h2>
          <div className="space-y-3">
            {document.signatures!.map((signature) => {
              let certificateInfo: any = null
              try {
                certificateInfo = signature.certificateInfo
                  ? JSON.parse(signature.certificateInfo)
                  : null
              } catch (e) {
                // Ignore parse errors
              }

              return (
                <div
                  key={signature.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={signature.signedByUser.avatar}
                        name={`${signature.signedByUser.firstName} ${signature.signedByUser.lastName}`}
                        size="sm"
                        userId={signature.signedByUser.id}
                        clickable={true}
                      />
                      <div>
                        <p className="text-white font-poppins font-semibold">
                          {signature.signedByUser.firstName} {signature.signedByUser.lastName}
                        </p>
                        <p className="text-xs text-gray-500 font-poppins">
                          {providerLabels[signature.provider] || signature.provider}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {signature.isValid ? (
                        <CheckCircle className="text-green-400" size={20} />
                      ) : (
                        <XCircle className="text-red-400" size={20} />
                      )}
                    </div>
                  </div>
                  {certificateInfo && (
                    <div className="mt-2 text-xs text-gray-400 font-poppins space-y-1">
                      {certificateInfo.subject && (
                        <p>Chủ thể: {certificateInfo.subject}</p>
                      )}
                      {certificateInfo.issuer && (
                        <p>Nhà cung cấp: {certificateInfo.issuer}</p>
                      )}
                      {certificateInfo.serial && (
                        <p>Số seri: {certificateInfo.serial}</p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2 font-poppins">
                    <Clock size={12} className="inline mr-1" />
                    {formatDistanceToNow(new Date(signature.timestamp), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Signed File Notice */}
      {document.signedFileUrl && (
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-blue-400">
            <CheckCircle size={20} />
            <p className="font-poppins font-semibold">Tài liệu đã được ký số</p>
          </div>
          <a
            href={document.signedFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm font-poppins mt-2 inline-block"
          >
            Xem file đã ký →
          </a>
        </div>
      )}

      {/* PDF Viewer */}
      {isPDF && (
        <PDFViewer
          fileUrl={document.fileUrl}
          fileName={document.title}
          isOpen={showPDFViewer}
          onClose={() => setShowPDFViewer(false)}
        />
      )}

      {/* Digital Signature Modal */}
      <DigitalSignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        documentId={document.id}
        documentType="document"
        onSuccess={() => {
          router.refresh()
        }}
      />
    </div>
  )
}

