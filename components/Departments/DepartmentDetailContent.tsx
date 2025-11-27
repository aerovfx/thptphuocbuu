'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, FileText, Plus, Edit, User, BookOpen, Trash2, X } from 'lucide-react'
import Avatar from '../Common/Avatar'
import SharedLayout from '../Layout/SharedLayout'
import UserSelectModal from './UserSelectModal'

interface DepartmentDetailContentProps {
  department: any
  currentUser: any
}

export default function DepartmentDetailContent({
  department,
  currentUser,
}: DepartmentDetailContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'documents'>('overview')
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState(department.members || [])
  const [showUserSelectModal, setShowUserSelectModal] = useState(false)

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers()
    }
  }, [activeTab, department.id])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/departments/${department.id}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const canManage =
    currentUser.user.role === 'ADMIN' ||
    currentUser.user.role === 'SUPER_ADMIN' ||
    currentUser.user.role === 'BGH' ||
    department.leaderId === currentUser.user.id

  return (
    <SharedLayout title={department.name}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/departments')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 font-poppins"
          >
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: department.color || '#10B981' }}
              >
                {department.icon || '📚'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
                  {department.name}
                </h1>
                {department.subject && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-poppins mb-1">
                    Môn: {department.subject}
                  </p>
                )}
                {department.description && (
                  <p className="text-gray-600 dark:text-gray-400 font-poppins">
                    {department.description}
                  </p>
                )}
                {department.space && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 font-poppins mt-1">
                    Space: {department.space.name}
                  </p>
                )}
              </div>
            </div>
            {canManage && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push(`/dashboard/departments/${department.id}/edit`)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-poppins font-semibold flex items-center space-x-2 transition-colors"
                >
                  <Edit size={18} />
                  <span>Chỉnh sửa</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <Users className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">Thành viên</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                  {department._count?.members || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <FileText className="text-purple-500" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">Văn bản</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                  {department._count?.documents || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex space-x-4">
            {[
              { id: 'overview', label: 'Tổng quan' },
              { id: 'members', label: 'Thành viên' },
              { id: 'documents', label: 'Văn bản' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-poppins font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {department.leader && (
                <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins mb-4">
                    Trưởng tổ
                  </h2>
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={department.leader.avatar}
                      name={`${department.leader.firstName} ${department.leader.lastName}`}
                      size="lg"
                    />
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                        {department.leader.firstName} {department.leader.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                        {department.leader.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
                  Thành viên ({members?.length || 0})
                </h2>
                {canManage && (
                  <button
                    onClick={() => setShowUserSelectModal(true)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-poppins font-semibold flex items-center space-x-2 transition-colors"
                  >
                    <Plus size={18} />
                    <span>Thêm thành viên</span>
                  </button>
                )}
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                {members && members.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {members.map((member: any) => (
                      <div
                        key={member.id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar
                            src={member.user.avatar}
                            name={`${member.user.firstName} ${member.user.lastName}`}
                            size="md"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-gray-900 dark:text-white font-poppins">
                                {member.user.firstName} {member.user.lastName}
                              </p>
                              {member.role === 'LEADER' && (
                                <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded font-poppins">
                                  Trưởng tổ
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                              {member.user.email} • {member.user.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded font-poppins">
                            {member.role}
                          </span>
                          {canManage && member.user.id !== currentUser.user.id && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Bạn có chắc chắn muốn xóa ${member.user.firstName} ${member.user.lastName} khỏi tổ này?`)) {
                                  return
                                }

                                setLoading(true)
                                try {
                                  const response = await fetch(
                                    `/api/departments/${department.id}/members?userId=${member.user.id}`,
                                    { method: 'DELETE' }
                                  )

                                  if (response.ok) {
                                    setMembers(members.filter((m: any) => m.id !== member.id))
                                    alert('Đã xóa thành viên thành công!')
                                  } else {
                                    const error = await response.json()
                                    alert(`Lỗi: ${error.error || 'Không thể xóa thành viên'}`)
                                  }
                                } catch (error) {
                                  console.error('Error removing member:', error)
                                  alert('Có lỗi xảy ra khi xóa thành viên')
                                } finally {
                                  setLoading(false)
                                }
                              }}
                              disabled={loading}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Xóa thành viên"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Users className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500 dark:text-gray-400 font-poppins">
                      Chưa có thành viên nào
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-poppins text-center py-12">
                Tính năng văn bản đang được phát triển...
              </p>
            </div>
          )}
        </div>

        {/* User Select Modal */}
        <UserSelectModal
          isOpen={showUserSelectModal}
          onClose={() => setShowUserSelectModal(false)}
          onSelect={async (selectedUser) => {
            setLoading(true)
            try {
              // Add member to department
              const response = await fetch(`/api/departments/${department.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUser.id, role: 'MEMBER' }),
              })

              if (response.ok) {
                const newMember = await response.json()
                setMembers([...members, newMember])
                alert('Đã thêm thành viên thành công!')
              } else {
                const error = await response.json()
                alert(`Lỗi: ${error.error || 'Không thể thêm thành viên'}`)
              }
            } catch (error) {
              console.error('Error adding member:', error)
              alert('Có lỗi xảy ra khi thêm thành viên')
            } finally {
              setLoading(false)
            }
          }}
          excludeUserIds={members.map((m: any) => m.user.id)}
          title="Chọn người dùng để thêm vào tổ"
        />
      </div>
    </SharedLayout>
  )
}

