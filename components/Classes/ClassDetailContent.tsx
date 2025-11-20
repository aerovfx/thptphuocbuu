'use client'

import { useState } from 'react'
import { Users, BookOpen, Plus, FileText, Calendar, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import Avatar from '../Common/Avatar'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import CreateAssignmentModal from './CreateAssignmentModal'

interface ClassDetailContentProps {
  classDetail: {
    id: string
    name: string
    code: string
    description: string | null
    subject: string
    grade: string
    teacher: {
      id: string
      firstName: string
      lastName: string
      avatar: string | null
    }
    enrollments: Array<{
      id: string
      enrolledAt: Date
      user: {
        id: string
        firstName: string
        lastName: string
        email: string
        avatar: string | null
      }
    }>
    assignments: Array<{
      id: string
      title: string
      description: string | null
      dueDate: Date
      maxScore: number
      createdAt: Date
      _count: {
        submissions: number
      }
    }>
    _count: {
      enrollments: number
      assignments: number
    }
  }
  currentUser: {
    user: {
      id: string
      role: string
    }
  }
}

export default function ClassDetailContent({
  classDetail,
  currentUser,
}: ClassDetailContentProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'assignments'>('assignments')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const isTeacher = currentUser.user.role === 'TEACHER'

  const tabs = [
    { id: 'assignments' as const, label: 'Bài học', icon: BookOpen },
    { id: 'students' as const, label: 'Học sinh', icon: Users },
  ]

  return (
    <div className="p-6">
      {/* Class Info Header */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 font-poppins">
              {classDetail.name}
            </h1>
            <p className="text-gray-400 font-poppins">{classDetail.code}</p>
            {classDetail.description && (
              <p className="text-gray-400 mt-2 font-poppins">{classDetail.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-gray-400 mb-2">
              <Users size={18} />
              <span className="font-poppins">{classDetail._count.enrollments} học sinh</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <FileText size={18} />
              <span className="font-poppins">{classDetail._count.assignments} bài học</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-4 border-b border-gray-800 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-3 font-poppins transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-500 font-semibold'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'students' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white font-poppins">
              Danh sách học sinh ({classDetail.enrollments.length})
            </h2>
          </div>

          {classDetail.enrollments.length === 0 ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-400 font-poppins">Chưa có học sinh nào trong lớp</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                      Học sinh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                      Ngày tham gia
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {classDetail.enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar
                            src={enrollment.user.avatar}
                            name={`${enrollment.user.firstName} ${enrollment.user.lastName}`}
                            size="sm"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white font-poppins">
                              {enrollment.user.firstName} {enrollment.user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400 font-poppins">
                          {enrollment.user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-poppins">
                        {formatDistanceToNow(new Date(enrollment.enrolledAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white font-poppins">
              Bài học và Bài tập ({classDetail.assignments.length})
            </h2>
            {isTeacher && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 font-poppins font-semibold transition-colors"
              >
                <Plus size={20} />
                <span>Tạo bài học mới</span>
              </button>
            )}
          </div>

          {classDetail.assignments.length === 0 ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
              <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-400 font-poppins mb-4">Chưa có bài học nào</p>
              {isTeacher && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-blue-500 hover:text-blue-400 font-medium font-poppins"
                >
                  Tạo bài học đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {classDetail.assignments.map((assignment) => {
                const isOverdue = new Date(assignment.dueDate) < new Date()
                const submissionCount = assignment._count.submissions
                const totalStudents = classDetail._count.enrollments

                return (
                  <Link
                    key={assignment.id}
                    href={`/dashboard/classes/${classDetail.id}/assignments/${assignment.id}`}
                    className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:bg-gray-800 transition-colors block"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-white font-poppins">
                            {assignment.title}
                          </h3>
                          {isOverdue && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 font-poppins">
                              Quá hạn
                            </span>
                          )}
                        </div>
                        {assignment.description && (
                          <p className="text-gray-400 text-sm mb-3 font-poppins line-clamp-2">
                            {assignment.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar size={16} />
                            <span className="font-poppins">
                              Hạn nộp:{' '}
                              {new Date(assignment.dueDate).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText size={16} />
                            <span className="font-poppins">
                              {submissionCount}/{totalStudents} đã nộp
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CheckCircle2 size={16} />
                            <span className="font-poppins">Tối đa: {assignment.maxScore} điểm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <CreateAssignmentModal
          classId={classDetail.id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

