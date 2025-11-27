'use client'

import { useState, useEffect } from 'react'
import { X, Image as ImageIcon, Paperclip, CheckSquare, MessageSquare, User, Calendar, Tag, Plus, Send, Trash2, Edit2, Upload, CheckCircle } from 'lucide-react'
import Avatar from '../Common/Avatar'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface Attachment {
  name: string
  url: string
  type?: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
}

interface Task {
  id: string
  title: string
  description: string | null
  column: string
  priority: string | null
  dueDate: string | null
  images: string | null
  attachments: string | null
  checklist: string | null
  tags: string | null
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  } | null
  commentsCount: number
  createdAt: string
}

interface TaskDetailModalProps {
  task: Task | null
  spaceId: string
  canManage: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function TaskDetailModal({
  task,
  spaceId,
  canManage,
  onClose,
  onUpdate,
}: TaskDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [spaceMembers, setSpaceMembers] = useState<any[]>([])
  const [showAssignModal, setShowAssignModal] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      fetchComments()
      fetchSpaceMembers()
    }
  }, [task, spaceId])

  const fetchSpaceMembers = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        const members = data.members?.map((m: any) => m.user).filter(Boolean) || []
        setSpaceMembers(members)
      }
    } catch (error) {
      console.error('Error fetching space members:', error)
    }
  }

  const fetchComments = async () => {
    if (!task) return

    try {
      setLoadingComments(true)
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${task.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return

    try {
      setSubmittingComment(true)
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      if (response.ok) {
        const newCommentData = await response.json()
        setComments([...comments, newCommentData])
        setNewComment('')
        onUpdate() // Refresh task list
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi thêm bình luận')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Đã xảy ra lỗi khi thêm bình luận')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleUpdateTitle = async () => {
    if (!task || !title.trim()) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
        }),
      })

      if (response.ok) {
        setEditingTitle(false)
        onUpdate()
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi cập nhật')
      }
    } catch (error) {
      console.error('Error updating title:', error)
      alert('Đã xảy ra lỗi khi cập nhật')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateDescription = async () => {
    if (!task) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim() || null,
        }),
      })

      if (response.ok) {
        setEditingDescription(false)
        onUpdate()
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi cập nhật')
      }
    } catch (error) {
      console.error('Error updating description:', error)
      alert('Đã xảy ra lỗi khi cập nhật')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh')
      return
    }

    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')

      const response = await fetch(`/api/spaces/${spaceId}/tasks/${task.id}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        onUpdate()
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi upload hình ảnh')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Đã xảy ra lỗi khi upload hình ảnh')
    } finally {
      setUploadingImage(false)
      e.target.value = '' // Reset input
    }
  }

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]

    try {
      setUploadingAttachment(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'attachment')

      const response = await fetch(`/api/spaces/${spaceId}/tasks/${task.id}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        onUpdate()
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi upload tệp đính kèm')
      }
    } catch (error) {
      console.error('Error uploading attachment:', error)
      alert('Đã xảy ra lỗi khi upload tệp đính kèm')
    } finally {
      setUploadingAttachment(false)
      e.target.value = '' // Reset input
    }
  }

  const handleAssignUser = () => {
    setShowAssignModal(true)
  }

  const handleUnassignUser = async () => {
    if (!task || !confirm('Bạn có chắc muốn hủy giao công việc này?')) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedToId: null,
        }),
      })

      if (response.ok) {
        onUpdate()
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi hủy giao')
      }
    } catch (error) {
      console.error('Error unassigning user:', error)
      alert('Đã xảy ra lỗi khi hủy giao')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectAssignee = async (userId: string) => {
    if (!task) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedToId: userId,
        }),
      })

      if (response.ok) {
        onUpdate()
        setShowAssignModal(false)
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi giao việc')
      }
    } catch (error) {
      console.error('Error assigning user:', error)
      alert('Đã xảy ra lỗi khi giao việc')
    } finally {
      setSubmitting(false)
    }
  }

  if (!task) return null

  const parseJSON = (jsonString: string | null): any[] => {
    if (!jsonString) return []
    try {
      const parsed = JSON.parse(jsonString)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const images = parseJSON(task.images) as string[]
  const checklist = parseJSON(task.checklist) as ChecklistItem[]
  const attachments = parseJSON(task.attachments) as Attachment[]
  const tags = parseJSON(task.tags) as string[]

  const completedChecklist = checklist.filter((item) => item.completed).length
  const totalChecklist = checklist.length

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500 text-white'
      case 'HIGH':
        return 'bg-orange-500 text-white'
      case 'LOW':
        return 'bg-gray-400 text-white'
      default:
        return 'bg-blue-500 text-white'
    }
  }

  const getPriorityLabel = (priority: string | null) => {
    switch (priority) {
      case 'URGENT':
        return 'Khẩn cấp'
      case 'HIGH':
        return 'Cao'
      case 'LOW':
        return 'Thấp'
      default:
        return 'Bình thường'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            {editingTitle && canManage ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins font-semibold"
                  autoFocus
                  onBlur={handleUpdateTitle}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateTitle()
                    }
                  }}
                />
                <button
                  onClick={handleUpdateTitle}
                  disabled={submitting}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-poppins disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
                  {task.title}
                </h2>
                {canManage && (
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white font-poppins">
                    Mô tả
                  </h3>
                  {canManage && !editingDescription && (
                    <button
                      onClick={() => setEditingDescription(true)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-poppins"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </div>
                {editingDescription && canManage ? (
                  <div className="space-y-2">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                      autoFocus
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleUpdateDescription}
                        disabled={submitting}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-poppins disabled:opacity-50"
                      >
                        {submitting ? 'Đang lưu...' : 'Lưu'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingDescription(false)
                          setDescription(task.description || '')
                        }}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-poppins"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 font-poppins whitespace-pre-line">
                    {task.description || 'Chưa có mô tả'}
                  </p>
                )}
              </div>

              {/* Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white font-poppins">
                    Hình ảnh
                  </h3>
                  {canManage && (
                    <label className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-poppins cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingImage ? 'Đang upload...' : 'Thêm hình ảnh'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadImage}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <a
                          href={image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg"
                        >
                          <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                    Chưa có hình ảnh nào
                  </p>
                )}
              </div>

              {/* Checklist */}
              {checklist.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white font-poppins mb-2">
                    Checklist ({completedChecklist}/{totalChecklist})
                  </h3>
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          disabled
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span
                          className={`flex-1 text-sm font-poppins ${
                            item.completed
                              ? 'line-through text-gray-500 dark:text-gray-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white font-poppins">
                    Tệp đính kèm ({attachments.length})
                  </h3>
                  {canManage && (
                    <label className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-poppins cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingAttachment ? 'Đang upload...' : 'Thêm tệp'}</span>
                      <input
                        type="file"
                        onChange={handleUploadAttachment}
                        className="hidden"
                        disabled={uploadingAttachment}
                      />
                    </label>
                  )}
                </div>
                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white font-poppins">
                          {attachment.name}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                    Chưa có tệp đính kèm nào
                  </p>
                )}
              </div>

              {/* Comments */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white font-poppins mb-4">
                  Bình luận ({comments.length})
                </h3>
                <div className="space-y-4">
                  {loadingComments ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <Avatar
                          src={comment.createdBy.avatar}
                          name={`${comment.createdBy.firstName} ${comment.createdBy.lastName}`}
                          size="sm"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white font-poppins text-sm">
                              {comment.createdBy.firstName} {comment.createdBy.lastName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                              {formatDistanceToNow(new Date(comment.createdAt), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 font-poppins text-sm">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 font-poppins text-sm text-center py-4">
                      Chưa có bình luận nào
                    </p>
                  )}

                  {/* Add Comment */}
                  <div className="flex items-start space-x-3">
                    <Avatar
                      src={null}
                      name="You"
                      size="sm"
                    />
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Thêm bình luận..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins text-sm"
                      />
                      <div className="flex items-center justify-end mt-2">
                        <button
                          onClick={handleAddComment}
                          disabled={submittingComment || !newComment.trim()}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-poppins disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          <span>{submittingComment ? 'Đang gửi...' : 'Gửi'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Status */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-poppins mb-2 uppercase">
                  Trạng thái
                </h3>
                <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-sm text-gray-900 dark:text-white font-poppins">
                    {task.column === 'todo' && 'To Do'}
                    {task.column === 'in-progress' && 'In Progress'}
                    {task.column === 'review' && 'Review'}
                    {task.column === 'done' && 'Done'}
                  </span>
                </div>
              </div>

              {/* Priority */}
              {task.priority && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-poppins mb-2 uppercase">
                    Độ ưu tiên
                  </h3>
                  <div className={`p-2 rounded-lg ${getPriorityColor(task.priority)}`}>
                    <span className="text-sm font-poppins font-semibold">
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>
                </div>
              )}

              {/* Assigned To */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-poppins uppercase">
                    Người được giao
                  </h3>
                  {canManage && (
                    <button
                      onClick={handleAssignUser}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-poppins"
                    >
                      {task.assignedTo ? 'Thay đổi' : 'Giao việc'}
                    </button>
                  )}
                </div>
                {task.assignedTo ? (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Avatar
                      src={task.assignedTo.avatar}
                      name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                      size="sm"
                    />
                    <span className="text-sm text-gray-900 dark:text-white font-poppins flex-1">
                      {task.assignedTo.firstName} {task.assignedTo.lastName}
                    </span>
                    {canManage && (
                      <button
                        onClick={handleUnassignUser}
                        className="ml-2 text-xs text-red-600 dark:text-red-400 hover:underline font-poppins"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                      Chưa giao
                    </span>
                  </div>
                )}
              </div>

              {/* Due Date */}
              {task.dueDate && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-poppins mb-2 uppercase">
                    Hạn chót
                  </h3>
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white font-poppins">
                      {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              )}

              {/* Created By */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-poppins mb-2 uppercase">
                  Người tạo
                </h3>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Avatar
                    src={task.createdBy.avatar}
                    name={`${task.createdBy.firstName} ${task.createdBy.lastName}`}
                    size="sm"
                  />
                  <span className="text-sm text-gray-900 dark:text-white font-poppins">
                    {task.createdBy.firstName} {task.createdBy.lastName}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-poppins mb-2 uppercase">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-poppins"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign User Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                Giao công việc
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {spaceMembers.length > 0 ? (
                spaceMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectAssignee(member.id)}
                    disabled={submitting}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Avatar
                      src={member.avatar}
                      name={`${member.firstName} ${member.lastName}`}
                      size="md"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 dark:text-white font-poppins">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                        {member.email}
                      </p>
                    </div>
                    {task?.assignedTo?.id === member.id && (
                      <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 font-poppins py-4">
                  Không có thành viên nào
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

