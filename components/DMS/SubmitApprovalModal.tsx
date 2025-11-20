'use client'

import { useState, useEffect } from 'react'
import { X, UserPlus, AlertCircle } from 'lucide-react'
import Avatar from '@/components/Common/Avatar'

interface SubmitApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (approvers: Array<{ userId: string; level: number; deadline?: string }>) => void
  documentId: string
  currentUser: any
}

export default function SubmitApprovalModal({
  isOpen,
  onClose,
  onSubmit,
  documentId,
  currentUser,
}: SubmitApprovalModalProps) {
  const [approvers, setApprovers] = useState<Array<{ userId: string; level: number; deadline?: string }>>([
    { userId: '', level: 1 },
  ])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Fetch users for selection
      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => {
          if (data.users) {
            setUsers(data.users.filter((u: any) => u.id !== currentUser.user.id))
          }
        })
        .catch(console.error)
    }
  }, [isOpen, currentUser])

  const handleAddApprover = () => {
    setApprovers([...approvers, { userId: '', level: approvers.length + 1 }])
  }

  const handleRemoveApprover = (index: number) => {
    if (approvers.length > 1) {
      setApprovers(approvers.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = () => {
    // Validate
    const hasEmpty = approvers.some((a) => !a.userId)
    if (hasEmpty) {
      setError('Vui lòng chọn người phê duyệt cho tất cả các cấp')
      return
    }

    const hasDuplicate = approvers.some(
      (a, i) => approvers.findIndex((a2) => a2.userId === a.userId) !== i
    )
    if (hasDuplicate) {
      setError('Mỗi người chỉ có thể phê duyệt một cấp')
      return
    }

    onSubmit(approvers)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
        <div className="sticky top-0 bg-bluelock-light-2 dark:bg-gray-900 border-b border-bluelock-blue/30 dark:border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-bluelock-dark dark:text-white font-poppins">
            Gửi để phê duyệt
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bluelock-light-3 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-bluelock-dark dark:text-white" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-400">
              <AlertCircle size={20} />
              <span className="font-poppins">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {approvers.map((approver, index) => (
              <div
                key={index}
                className="p-4 bg-bluelock-light dark:bg-gray-800 rounded-lg border border-bluelock-blue/30 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bluelock-green/20 dark:bg-blue-500/20 text-bluelock-green dark:text-blue-400 font-bold font-poppins">
                      {approver.level}
                    </div>
                    <span className="text-bluelock-dark dark:text-white font-poppins font-semibold">
                      Cấp {approver.level}
                    </span>
                  </div>
                  {approvers.length > 1 && (
                    <button
                      onClick={() => handleRemoveApprover(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
                      Người phê duyệt <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={approver.userId}
                      onChange={(e) => {
                        const newApprovers = [...approvers]
                        newApprovers[index].userId = e.target.value
                        setApprovers(newApprovers)
                        setError(null)
                      }}
                      className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins transition-colors duration-300"
                    >
                      <option value="">Chọn người phê duyệt</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
                      Hạn phê duyệt (tùy chọn)
                    </label>
                    <input
                      type="datetime-local"
                      value={approver.deadline || ''}
                      onChange={(e) => {
                        const newApprovers = [...approvers]
                        newApprovers[index].deadline = e.target.value
                        setApprovers(newApprovers)
                      }}
                      className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins transition-colors duration-300"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddApprover}
            className="mt-4 w-full px-4 py-2 border-2 border-dashed border-bluelock-blue/30 dark:border-gray-700 hover:border-bluelock-green dark:hover:border-blue-500 rounded-lg text-bluelock-dark dark:text-white font-poppins font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <UserPlus size={18} />
            <span>Thêm cấp phê duyệt</span>
          </button>

          <div className="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-bluelock-blue/30 dark:border-gray-800">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-bluelock-light-2 dark:bg-gray-800 hover:bg-bluelock-light-3 dark:hover:bg-gray-700 text-bluelock-dark dark:text-white rounded-lg font-poppins font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors shadow-bluelock-glow dark:shadow-none"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi phê duyệt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

