'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Settings, FileText, Plus, MoreVertical, Edit, Trash2, LayoutDashboard, CheckSquare, FolderTree } from 'lucide-react'
import Avatar from '../Common/Avatar'
import DepartmentList from '../Departments/DepartmentList'
import SharedLayout from '../Layout/SharedLayout'
import UserSelectModal from '../Departments/UserSelectModal'
import SpaceDocumentsList from './SpaceDocumentsList'
import TrelloScrumBoard from './TrelloScrumBoard'
import SpaceOverview from './SpaceOverview'
import JiraTaskBoard from './JiraTaskBoard'

interface SpaceDetailContentProps {
  space: any
  currentUser: any
}

export default function SpaceDetailContent({ space, currentUser }: SpaceDetailContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'members' | 'departments' | 'documents'>(
    'overview'
  )
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState(space.members || [])
  const [showUserSelectModal, setShowUserSelectModal] = useState(false)

  const canManage =
    currentUser.user.role === 'ADMIN' ||
    currentUser.user.role === 'SUPER_ADMIN' ||
    space.members.find((m: any) => m.userId === currentUser.user.id)?.canManage

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers()
    }
  }, [activeTab, space.id])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/spaces/${space.id}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  return (
    <SharedLayout title={space.name}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/spaces')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 font-poppins"
          >
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: space.color || '#6366F1' }}
              >
                {space.icon || '🏢'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
                  {space.name}
                </h1>
                {space.description && (
                  <p className="text-gray-600 dark:text-gray-400 font-poppins">
                    {space.description}
                  </p>
                )}
                {space.parent && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 font-poppins mt-1">
                    Thuộc: {space.parent.name}
                  </p>
                )}
              </div>
            </div>
            {canManage && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push(`/dashboard/spaces/${space.id}/edit`)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins font-semibold flex items-center space-x-2 transition-colors"
                >
                  <Edit size={18} />
                  <span>Chỉnh sửa</span>
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Bạn có chắc chắn muốn xóa space "${space.name}"? Hành động này không thể hoàn tác.`)) {
                      return
                    }

                    setLoading(true)
                    try {
                      const response = await fetch(`/api/spaces/${space.id}`, {
                        method: 'DELETE',
                      })

                      if (response.ok) {
                        alert('Space đã được xóa thành công!')
                        router.push('/dashboard/spaces')
                      } else {
                        const error = await response.json()
                        alert(`Lỗi: ${error.error || 'Không thể xóa space'}`)
                      }
                    } catch (error) {
                      console.error('Error deleting space:', error)
                      alert('Có lỗi xảy ra khi xóa space')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-poppins font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={18} />
                  <span>Xóa space</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">Thành viên</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                  {space._count?.members || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Settings className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">Tổ/Bộ phận</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                  {space._count?.departments || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <FileText className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">Nhiệm vụ</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                  {space._count?.tasks || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">Văn bản</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                  {space._count?.documents || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex space-x-4">
            {[
              { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
              { id: 'tasks', label: 'Nhiệm vụ', icon: CheckSquare },
              { id: 'members', label: 'Thành viên', icon: Users },
              { id: 'departments', label: 'Tổ/Bộ phận', icon: FolderTree },
              { id: 'documents', label: 'Văn bản', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon
              return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-poppins font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Space Overview */}
              <SpaceOverview
                spaceId={space.id}
                overview={space.overview || null}
                members={space.members || []}
                canManage={canManage || false}
              />

              {/* Progress Tracker */}
              <TrelloScrumBoard
                spaceId={space.id}
                currentProgress={space.progress || 0}
                canManage={canManage || false}
              />

              {space.children && space.children.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins mb-4">
                    Spaces con
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {space.children.map((child: any) => (
                      <div
                        key={child.id}
                        onClick={() => router.push(`/dashboard/spaces/${child.id}`)}
                        className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:border-blue-500 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: child.color || '#6366F1' }}
                          >
                            {child.icon || '📁'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white font-poppins">
                              {child.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                              {child._count?.members || 0} thành viên
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
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
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins font-semibold flex items-center space-x-2 transition-colors"
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
                            <p className="font-semibold text-gray-900 dark:text-white font-poppins">
                              {member.user.firstName} {member.user.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                              {member.user.email} • {member.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {member.canRead && (
                            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded font-poppins">
                              Đọc
                            </span>
                          )}
                          {member.canWrite && (
                            <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded font-poppins">
                              Ghi
                            </span>
                          )}
                          {member.canManage && (
                            <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded font-poppins">
                              Quản lý
                            </span>
                          )}
                          {canManage && member.user.id !== currentUser.user.id && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Bạn có chắc chắn muốn xóa ${member.user.firstName} ${member.user.lastName} khỏi space này?`)) {
                                  return
                                }

                                setLoading(true)
                                try {
                                  const response = await fetch(
                                    `/api/spaces/${space.id}/members?userId=${member.user.id}`,
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
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
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

          {activeTab === 'tasks' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
                    Quản lý nhiệm vụ
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins mt-1">
                    Tổng cộng: {space._count?.tasks || 0} nhiệm vụ
                  </p>
                </div>
                <Link
                  href={`/dashboard/spaces/${space.id}/tasks`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-poppins flex items-center space-x-1"
                >
                  <span>Xem tất cả</span>
                  <span>→</span>
                </Link>
              </div>
              <JiraTaskBoard spaceId={space.id} canManage={canManage || false} />
            </div>
          )}

          {activeTab === 'departments' && (
            <div>
              <DepartmentList
                initialDepartments={space.departments || []}
                spaceId={space.id}
                canCreate={canManage}
              />
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <SpaceDocumentsList spaceId={space.id} canCreate={canManage} />
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
              // Add member to space
              const response = await fetch(`/api/spaces/${space.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: selectedUser.id,
                  role: 'MEMBER',
                  canRead: true,
                  canWrite: false,
                  canManage: false,
                }),
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
          title="Chọn người dùng để thêm vào space"
        />
      </div>
    </SharedLayout>
  )
}

