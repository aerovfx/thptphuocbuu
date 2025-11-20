'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Image, Smile, MapPin, Calendar, X, Video } from 'lucide-react'
import Avatar from '../Common/Avatar'
import { validateImage, validateVideo, validateVideoDuration, ALLOWED_IMAGE_TYPES } from '@/lib/file-validation'

// Dynamic import emoji picker để tránh SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
})

interface MediaPreview {
  url: string
  type: 'image' | 'video'
  file?: File
}

interface Post {
  id: string
  content: string
  createdAt: Date
  imageUrl?: string | null
  videoUrl?: string | null
  type?: string
  locationName?: string | null
  latitude?: number | null
  longitude?: number | null
  scheduledAt?: Date | null
  author: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
  }
  _count?: {
    likes: number
    comments: number
  }
}

interface EditPostModalProps {
  post: Post
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function EditPostModal({ post, isOpen, onClose, onSuccess }: EditPostModalProps) {
  const router = useRouter()
  const [content, setContent] = useState(post.content || '')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [location, setLocation] = useState<{
    name: string
    latitude: number
    longitude: number
  } | null>(
    post.locationName && post.latitude && post.longitude
      ? {
          name: post.locationName,
          latitude: post.latitude,
          longitude: post.longitude,
        }
      : null
  )
  const [gettingLocation, setGettingLocation] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(
    post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ''
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const scheduleModalRef = useRef<HTMLDivElement>(null)

  // Initialize media preview from existing post
  useEffect(() => {
    if (post.imageUrl) {
      setMediaPreview({
        url: post.imageUrl,
        type: 'image',
      })
    } else if (post.videoUrl) {
      setMediaPreview({
        url: post.videoUrl,
        type: 'video',
      })
    }
  }, [post])

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    
    return () => observer.disconnect()
  }, [])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('[data-emoji-button]')
      ) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  // Close schedule modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        scheduleModalRef.current &&
        !scheduleModalRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('[data-schedule-button]')
      ) {
        setShowScheduleModal(false)
      }
    }

    if (showScheduleModal) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showScheduleModal])

  // Call publish endpoint on mount
  useEffect(() => {
    fetch('/api/posts/scheduled/publish', { method: 'POST' }).catch(console.error)
  }, [])

  if (!isOpen) return null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    
    // Validate file type and size
    const validation = isImage ? validateImage(file) : validateVideo(file)
    if (!validation.valid) {
      alert(validation.error)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // For videos, validate duration (0-5s)
    if (!isImage) {
      try {
        const durationValidation = await validateVideoDuration(file)
        if (!durationValidation.valid) {
          alert(durationValidation.error)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          return
        }
      } catch (error) {
        alert('Không thể đọc thông tin video. Vui lòng thử lại với video khác.')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setMediaPreview({
        url: reader.result as string,
        type: isImage ? 'image' : 'video',
        file,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveMedia = () => {
    setMediaPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleEmojiClick = () => {
    setShowEmojiPicker(!showEmojiPicker)
  }

  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.emoji
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = content
      const newText = text.substring(0, start) + emoji + text.substring(end)
      setContent(newText)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    }
    setShowEmojiPicker(false)
  }

  const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'THPT-PhuocBuu-LMS/1.0',
          },
        }
      )
      const data = await response.json()
      
      if (data.address) {
        const parts: string[] = []
        if (data.address.road) parts.push(data.address.road)
        if (data.address.suburb || data.address.neighbourhood) {
          parts.push(data.address.suburb || data.address.neighbourhood)
        }
        if (data.address.city || data.address.town || data.address.village) {
          parts.push(data.address.city || data.address.town || data.address.village)
        }
        if (data.address.state) parts.push(data.address.state)
        if (data.address.country) parts.push(data.address.country)
        
        return parts.length > 0 ? parts.join(', ') : data.display_name || 'Vị trí không xác định'
      }
      return data.display_name || 'Vị trí không xác định'
    } catch (error) {
      console.error('Error getting location name:', error)
      return `Vị trí (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
    }
  }

  const handleLocationClick = async () => {
    if (location) {
      setLocation(null)
      return
    }

    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị')
      return
    }

    setGettingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const locationName = await getLocationName(latitude, longitude)
        setLocation({
          name: locationName,
          latitude,
          longitude,
        })
        setGettingLocation(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        let errorMessage = 'Không thể lấy vị trí'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Quyền truy cập vị trí bị từ chối'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Thông tin vị trí không khả dụng'
            break
          case error.TIMEOUT:
            errorMessage = 'Hết thời gian chờ lấy vị trí'
            break
        }
        alert(errorMessage)
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleScheduleClick = () => {
    setShowScheduleModal(true)
  }

  const handleScheduleConfirm = () => {
    setShowScheduleModal(false)
  }

  const handleScheduleCancel = () => {
    setScheduledDateTime('')
    setShowScheduleModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && !mediaPreview) {
      alert('Vui lòng nhập nội dung hoặc đính kèm media')
      return
    }

    setLoading(true)
    setUploading(!!mediaPreview?.file)

    try {
      let imageUrl = post.imageUrl || null
      let videoUrl = post.videoUrl || null

      // Upload new media if exists
      if (mediaPreview?.file) {
        const formData = new FormData()
        formData.append('file', mediaPreview.file)

        const uploadResponse = await fetch('/api/posts/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Lỗi khi tải lên file')
        }

        const uploadData = await uploadResponse.json()
        if (uploadData.type === 'image') {
          imageUrl = uploadData.url
          videoUrl = null
        } else {
          videoUrl = uploadData.url
          imageUrl = null
        }
      } else if (mediaPreview) {
        // Keep existing media
        if (mediaPreview.type === 'image') {
          imageUrl = mediaPreview.url
          videoUrl = null
        } else {
          videoUrl = mediaPreview.url
          imageUrl = null
        }
      } else {
        // Remove media
        imageUrl = null
        videoUrl = null
      }

      const postData: any = {
        content: content.trim() || '',
        imageUrl,
        videoUrl,
      }

      if (location) {
        postData.locationName = location.name
        postData.latitude = location.latitude
        postData.longitude = location.longitude
      }

      if (scheduledDateTime) {
        postData.scheduledAt = new Date(scheduledDateTime).toISOString()
      }

      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      })

      if (response.ok) {
        setContent('')
        setMediaPreview(null)
        setLocation(null)
        setScheduledDateTime('')
        if (onSuccess) {
          onSuccess()
        }
        router.refresh()
        onClose()
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${JSON.stringify(errorData.details)}`
          : errorData.error || 'Lỗi khi cập nhật bài viết'
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('Error updating post:', error)
      alert(error.message || 'Đã xảy ra lỗi khi cập nhật bài viết')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-bluelock-light dark:bg-gray-900 rounded-2xl p-6 w-full max-w-2xl border border-bluelock-blue/30 dark:border-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-bluelock-dark dark:text-white font-poppins">
            Chỉnh sửa bài viết
          </h2>
          <button
            onClick={onClose}
            className="text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-dark dark:hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar
              src={post.author.avatar}
              name={`${post.author.firstName} ${post.author.lastName}`}
              size="md"
            />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bạn đang nghĩ gì?"
                className="w-full bg-transparent text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 resize-none outline-none font-poppins text-base"
                rows={4}
              />
            </div>
          </div>

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative rounded-2xl overflow-hidden border border-bluelock-blue/30 dark:border-gray-800">
              {mediaPreview.type === 'image' ? (
                <img
                  src={mediaPreview.url}
                  alt="Preview"
                  className="w-full max-h-96 object-contain bg-bluelock-light-2 dark:bg-gray-900"
                />
              ) : (
                <video
                  src={mediaPreview.url}
                  controls
                  className="w-full max-h-96 object-contain bg-bluelock-light-2 dark:bg-gray-900"
                >
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              )}
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Location Display */}
          {location && (
            <div className="flex items-center space-x-2 text-sm text-bluelock-dark/70 dark:text-gray-400">
              <MapPin size={14} />
              <span className="font-poppins">{location.name}</span>
            </div>
          )}

          {/* Schedule Display */}
          {scheduledDateTime && (
            <div className="flex items-center space-x-2 text-sm text-bluelock-dark/70 dark:text-gray-400">
              <Calendar size={14} />
              <span className="font-poppins">
                Lên lịch: {new Date(scheduledDateTime).toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-bluelock-blue/30 dark:border-gray-800">
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10 rounded-full transition-colors"
                title="Đính kèm media"
              >
                {mediaPreview?.type === 'video' ? <Video size={20} /> : <Image size={20} />}
              </button>

              <button
                type="button"
                data-emoji-button
                onClick={handleEmojiClick}
                className="p-2 text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10 rounded-full transition-colors"
                title="Emoji"
              >
                <Smile size={20} />
              </button>

              <button
                type="button"
                onClick={handleLocationClick}
                disabled={gettingLocation}
                className={`p-2 rounded-full transition-colors ${
                  location
                    ? 'text-bluelock-green dark:text-blue-500 bg-bluelock-green/10 dark:bg-blue-500/10'
                    : 'text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10'
                }`}
                title="Thêm vị trí"
              >
                <MapPin size={20} />
              </button>

              <button
                type="button"
                data-schedule-button
                onClick={handleScheduleClick}
                className={`p-2 rounded-full transition-colors ${
                  scheduledDateTime
                    ? 'text-bluelock-green dark:text-blue-500 bg-bluelock-green/10 dark:bg-blue-500/10'
                    : 'text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10'
                }`}
                title="Lên lịch đăng bài"
              >
                <Calendar size={20} />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || uploading || (!content.trim() && !mediaPreview)}
              className="px-6 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
            >
              {loading || uploading ? 'Đang xử lý...' : 'Cập nhật'}
            </button>
          </div>
        </form>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-10">
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              theme={isDarkMode ? 'dark' : 'light'}
              locale="vi"
            />
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
            <div
              ref={scheduleModalRef}
              className="bg-bluelock-light dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-bluelock-blue/30 dark:border-gray-800 shadow-xl"
            >
              <h3 className="text-xl font-bold mb-4 text-bluelock-dark dark:text-white font-poppins">
                Lên lịch đăng bài
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-bluelock-dark dark:text-white font-poppins">
                    Chọn thời gian đăng
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 bg-bluelock-light-2 dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500"
                  />
                </div>

                {scheduledDateTime && (
                  <div className="text-sm text-bluelock-dark/70 dark:text-gray-400 font-poppins">
                    Bài viết sẽ được đăng vào:{' '}
                    <span className="font-semibold text-bluelock-dark dark:text-white">
                      {new Date(scheduledDateTime).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleScheduleCancel}
                    className="px-4 py-2 text-bluelock-dark dark:text-white hover:bg-bluelock-light-2 dark:hover:bg-gray-800 rounded-full transition-colors font-poppins"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleScheduleConfirm}
                    disabled={!scheduledDateTime}
                    className="px-4 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

