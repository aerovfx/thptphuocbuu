'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  User,
  Download,
  Edit,
  X,
} from 'lucide-react'
import Avatar from '../Common/Avatar'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'

interface AssignmentDetailContentProps {
  assignment: {
    id: string
    title: string
    description: string | null
    dueDate: Date
    maxScore: number
    createdAt: Date
    class: {
      id: string
      name: string
      code: string
    }
    teacher: {
      id: string
      firstName: string
      lastName: string
      avatar: string | null
      email: string
    }
    submissions: Array<{
      id: string
      content: string | null
      fileUrl: string | null
      submittedAt: Date
      student: {
        id: string
        firstName: string
        lastName: string
        avatar: string | null
        email: string
      }
      grade: {
        id: string
        score: number
        feedback: string | null
        gradedAt: Date
        teacher: {
          id: string
          firstName: string
          lastName: string
        }
      } | null
    }>
    _count: {
      submissions: number
    }
  }
  userSubmission: {
    id: string
    content: string | null
    fileUrl: string | null
    submittedAt: Date
    grade: {
      id: string
      score: number
      feedback: string | null
      gradedAt: Date
    } | null
  } | null
  isTeacher: boolean
  currentUser: {
    user: {
      id: string
      role: string
    }
  }
}

export default function AssignmentDetailContent({
  assignment,
  userSubmission,
  isTeacher,
  currentUser,
}: AssignmentDetailContentProps) {
  const router = useRouter()
  const [submissionContent, setSubmissionContent] = useState(userSubmission?.content || '')
  const [submitting, setSubmitting] = useState(false)
  const [showSubmissionForm, setShowSubmissionForm] = useState(!userSubmission)

  const isOverdue = new Date(assignment.dueDate) < new Date()
  const dueDateFormatted = new Date(assignment.dueDate).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleSubmit = async () => {
    if (!submissionContent.trim()) {
      alert('Vui lòng nhập nội dung bài làm')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/assignments/${assignment.id}/submissions`, {
        method: userSubmission ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: submissionContent,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Không thể nộp bài')
      }

      alert('Nộp bài thành công!')
      window.location.reload()
    } catch (error: any) {
      console.error('Error submitting assignment:', error)
      alert(error.message || 'Không thể nộp bài')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/dashboard/classes/${assignment.class.id}`)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-4 font-poppins"
        >
          <ArrowLeft size={20} />
          <span>Quay lại lớp học</span>
        </button>
        <h1 className="text-3xl font-bold text-white mb-2 font-poppins">{assignment.title}</h1>
        <div className="flex items-center space-x-4 text-gray-400 text-sm font-poppins">
          <span>{assignment.class.name}</span>
          <span>•</span>
          <span>{assignment.class.code}</span>
        </div>
      </div>

      {/* Assignment Info */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Calendar size={20} className="text-gray-400" />
              <h3 className="text-lg font-semibold text-white font-poppins">Thông tin bài học</h3>
            </div>
            <div className="space-y-3 text-gray-300 font-poppins">
              <div>
                <span className="text-gray-400">Giáo viên: </span>
                <div className="flex items-center space-x-2 mt-1">
                  <Avatar
                    src={assignment.teacher.avatar}
                    name={`${assignment.teacher.firstName} ${assignment.teacher.lastName}`}
                    size="sm"
                  />
                  <span>
                    {assignment.teacher.firstName} {assignment.teacher.lastName}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-400">Hạn nộp: </span>
                <span className={isOverdue ? 'text-red-400' : ''}>{dueDateFormatted}</span>
                {isOverdue && <span className="ml-2 text-red-400">(Quá hạn)</span>}
              </div>
              <div>
                <span className="text-gray-400">Điểm tối đa: </span>
                <span className="text-white font-semibold">{assignment.maxScore} điểm</span>
              </div>
              <div>
                <span className="text-gray-400">Số học sinh đã nộp: </span>
                <span className="text-white">
                  {assignment._count.submissions} / {assignment.class.name}
                </span>
              </div>
            </div>
          </div>

          {assignment.description && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 font-poppins">Mô tả</h3>
              <p className="text-gray-300 whitespace-pre-wrap font-poppins">{assignment.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Student View - Submission Form */}
      {!isTeacher && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 font-poppins">Bài làm của bạn</h2>

          {userSubmission ? (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle2 size={20} />
                    <span className="font-semibold font-poppins">Đã nộp bài</span>
                  </div>
                  <span className="text-gray-400 text-sm font-poppins">
                    {formatDistanceToNow(new Date(userSubmission.submittedAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
                {userSubmission.content && (
                  <p className="text-gray-300 whitespace-pre-wrap mt-2 font-poppins">
                    {userSubmission.content}
                  </p>
                )}
                {userSubmission.fileUrl && (
                  <a
                    href={userSubmission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 mt-2 font-poppins"
                  >
                    <Download size={16} />
                    <span>Tải file đã nộp</span>
                  </a>
                )}
              </div>

              {userSubmission.grade && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-400 font-semibold font-poppins">Điểm số</span>
                    <span className="text-white text-xl font-bold font-poppins">
                      {userSubmission.grade.score} / {assignment.maxScore}
                    </span>
                  </div>
                  {userSubmission.grade.feedback && (
                    <p className="text-gray-300 mt-2 font-poppins">{userSubmission.grade.feedback}</p>
                  )}
                  <p className="text-gray-400 text-sm mt-2 font-poppins">
                    Chấm điểm{' '}
                    {formatDistanceToNow(new Date(userSubmission.grade.gradedAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowSubmissionForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-poppins"
              >
                <Edit size={16} className="inline mr-2" />
                Chỉnh sửa bài làm
              </button>
            </div>
          ) : null}

          {showSubmissionForm && (
            <div className="mt-4">
              <textarea
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Nhập nội dung bài làm của bạn..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins min-h-[200px]"
              />
              <div className="flex items-center justify-end space-x-3 mt-4">
                {userSubmission && (
                  <button
                    onClick={() => {
                      setShowSubmissionForm(false)
                      setSubmissionContent(userSubmission.content || '')
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-poppins"
                  >
                    Hủy
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !submissionContent.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold"
                >
                  {submitting ? 'Đang nộp...' : userSubmission ? 'Cập nhật bài làm' : 'Nộp bài'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teacher View - Submissions List */}
      {isTeacher && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 font-poppins">
            Danh sách bài nộp ({assignment.submissions.length})
          </h2>

          {assignment.submissions.length === 0 ? (
            <p className="text-gray-400 text-center py-8 font-poppins">Chưa có học sinh nào nộp bài</p>
          ) : (
            <div className="space-y-4">
              {assignment.submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={submission.student.avatar}
                        name={`${submission.student.firstName} ${submission.student.lastName}`}
                        size="md"
                      />
                      <div>
                        <p className="text-white font-semibold font-poppins">
                          {submission.student.firstName} {submission.student.lastName}
                        </p>
                        <p className="text-gray-400 text-sm font-poppins">{submission.student.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm font-poppins">
                        {formatDistanceToNow(new Date(submission.submittedAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                      {submission.grade && (
                        <p className="text-blue-400 font-semibold mt-1 font-poppins">
                          {submission.grade.score} / {assignment.maxScore}
                        </p>
                      )}
                    </div>
                  </div>

                  {submission.content && (
                    <p className="text-gray-300 whitespace-pre-wrap mb-3 font-poppins">
                      {submission.content}
                    </p>
                  )}

                  {submission.fileUrl && (
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-3 font-poppins"
                    >
                      <Download size={16} />
                      <span>Tải file</span>
                    </a>
                  )}

                  {submission.grade && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-gray-400 text-sm font-poppins mb-1">Nhận xét:</p>
                      <p className="text-gray-300 font-poppins">{submission.grade.feedback || 'Không có nhận xét'}</p>
                    </div>
                  )}

                  <button
                    onClick={() => router.push(`/dashboard/classes/${assignment.class.id}/assignments/${assignment.id}/grade/${submission.id}`)}
                    className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-poppins"
                  >
                    {submission.grade ? 'Chỉnh sửa điểm' : 'Chấm điểm'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

