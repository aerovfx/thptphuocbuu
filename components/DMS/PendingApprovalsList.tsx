'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  User,
  Calendar,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Avatar from '@/components/Common/Avatar'

interface PendingApproval {
  id: string
  level: number
  status: string
  deadline: Date | null
  createdAt: Date
  incomingDocument: {
    id: string
    title: string
    status: string
    priority: string
    sender: string | null
  } | null
  outgoingDocument: {
    id: string
    title: string
    status: string
    priority: string
    recipient: string | null
  } | null
  workItem: {
    id: string
    title: string
    status: string
    priority: string
  } | null
}

interface PendingApprovalsListProps {
  initialApprovals: PendingApproval[]
  currentUser: any
}

const priorityLabels: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Khẩn', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  HIGH: { label: 'Cao', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
  NORMAL: { label: 'Bình thường', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  LOW: { label: 'Thấp', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
}

export default function PendingApprovalsList({
  initialApprovals,
  currentUser,
}: PendingApprovalsListProps) {
  const router = useRouter()
  const [approvals, setApprovals] = useState(initialApprovals)

  const getDocumentInfo = (approval: PendingApproval) => {
    if (approval.outgoingDocument) {
      return {
        id: approval.outgoingDocument.id,
        title: approval.outgoingDocument.title,
        type: 'OUTGOING',
        priority: approval.outgoingDocument.priority,
        detail: approval.outgoingDocument.recipient,
        href: `/dashboard/dms/outgoing/${approval.outgoingDocument.id}`,
      }
    } else if (approval.incomingDocument) {
      return {
        id: approval.incomingDocument.id,
        title: approval.incomingDocument.title,
        type: 'INCOMING',
        priority: approval.incomingDocument.priority,
        detail: approval.incomingDocument.sender,
        href: `/dashboard/dms/incoming/${approval.incomingDocument.id}`,
      }
    } else if (approval.workItem) {
      return {
        id: approval.workItem.id,
        title: approval.workItem.title,
        type: 'WORK_ITEM',
        priority: approval.workItem.priority,
        detail: null,
        href: `/dashboard/dms/workflow/${approval.workItem.id}`,
      }
    }
    return null
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-bluelock-dark dark:text-white mb-2 font-poppins">
          Chờ phê duyệt
        </h1>
        <p className="text-bluelock-dark/60 dark:text-gray-400 font-poppins">
          Danh sách các văn bản cần bạn phê duyệt
        </p>
      </div>

      {approvals.length === 0 ? (
        <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-12 text-center border border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
          <CheckCircle className="mx-auto text-bluelock-green dark:text-green-400 mb-4" size={48} />
          <p className="text-bluelock-dark/60 dark:text-gray-400 text-lg font-poppins">
            Không có văn bản nào chờ phê duyệt
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => {
            const docInfo = getDocumentInfo(approval)
            if (!docInfo) return null

            const priorityInfo = priorityLabels[docInfo.priority] || {
              label: docInfo.priority,
              color: 'bg-gray-500/20 text-gray-400',
            }

            const isOverdue = approval.deadline && new Date(approval.deadline) < new Date()

            return (
              <div
                key={approval.id}
                onClick={() => router.push(docInfo.href)}
                className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800 hover:border-bluelock-green dark:hover:border-blue-500 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bluelock-green/20 dark:bg-blue-500/20 text-bluelock-green dark:text-blue-400 font-bold font-poppins">
                        {approval.level}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-bluelock-dark dark:text-white font-poppins">
                          {docInfo.title}
                        </h3>
                        <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                          {docInfo.type === 'OUTGOING' ? 'Văn bản đi' : docInfo.type === 'INCOMING' ? 'Văn bản đến' : 'Hồ sơ công việc'}
                          {docInfo.detail && ` • ${docInfo.detail}`}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${priorityInfo.color} font-poppins`}
                      >
                        {priorityInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins mb-4">
                      <div className="flex items-center space-x-1">
                        <Calendar size={16} />
                        <span>
                          Tạo {formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {approval.deadline && (
                        <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-400' : ''}`}>
                          <Clock size={16} />
                          <span>
                            Hạn: {formatDistanceToNow(new Date(approval.deadline), { addSuffix: true })}
                            {isOverdue && ' (Quá hạn)'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`${docInfo.href}/approve`)
                        }}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle size={18} />
                        <span>Phê duyệt</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`${docInfo.href}/reject`)
                        }}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2"
                      >
                        <XCircle size={18} />
                        <span>Từ chối</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

