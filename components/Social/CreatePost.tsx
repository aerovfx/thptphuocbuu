'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Image, Smile, MapPin, Calendar, X, Video } from 'lucide-react'
import Avatar from '../Common/Avatar'
import { validateImage, validateVideo, ALLOWED_IMAGE_TYPES, MAX_VIDEO_SIZE_NORMAL, MAX_VIDEO_SIZE_PREMIUM, MAX_IMAGES_COUNT } from '@/lib/file-validation'
import { extractFirstUrl } from '@/lib/media-embed'
import { hasPremiumOrAdminAccess } from '@/lib/premium-check'
import ImageLightbox from '../Common/ImageLightbox'

// Dynamic import emoji picker để tránh SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
})

interface MediaPreview {
  url: string
  type: 'image' | 'video'
  file?: File
}

interface ImagePreview {
  url: string
  file: File
}

export default function CreatePost() {
  const { data: session } = useSession()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null)
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [location, setLocation] = useState<{
    name: string
    latitude: number
    longitude: number
  } | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduledDateTime, setScheduledDateTime] = useState<string>('')
  const [moderationError, setModerationError] = useState<{
    message: string
    violations: any[]
    suggestions: any[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const scheduleModalRef = useRef<HTMLDivElement>(null)

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    
    return () => observer.disconnect()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !mediaPreview && imagePreviews.length === 0) return

    setLoading(true)
    try {
      let imageUrl = null
      let videoUrl = null
      let imageUrls: string[] = []

      // Upload multiple images if exists
      if (imagePreviews.length > 0) {
        setUploading(true)
        for (const preview of imagePreviews) {
          const formData = new FormData()
          formData.append('file', preview.file)

          const uploadResponse = await fetch('/api/posts/upload', {
            method: 'POST',
            body: formData,
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json()
            throw new Error(errorData.error || 'Lỗi khi tải lên ảnh')
          }

          const uploadData = await uploadResponse.json()
          imageUrls.push(uploadData.url)
        }
        setUploading(false)
      }
      // Upload single video if exists
      else if (mediaPreview?.file) {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', mediaPreview.file)

        const uploadResponse = await fetch('/api/posts/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || 'Lỗi khi tải lên media')
        }

        const uploadData = await uploadResponse.json()
        if (uploadData.type === 'image') {
          imageUrl = uploadData.url
        } else {
          videoUrl = uploadData.url
        }
        setUploading(false)
      }

      // Create post
      const postData: any = {
        content: content.trim() || '',
      }

      // If user pasted a link (e.g. YouTube) in content and didn't attach media,
      // send it as linkUrl so the UI can embed it.
      if (!imageUrl && !videoUrl && imageUrls.length === 0) {
        const firstUrl = extractFirstUrl(postData.content)
        if (firstUrl) {
          postData.linkUrl = firstUrl
        }
      }

      // Include images array if exists
      if (imageUrls.length > 0) {
        postData.images = imageUrls
      }
      // Only include imageUrl/videoUrl if they exist (backward compatibility)
      if (imageUrl) {
        postData.imageUrl = imageUrl
      }
      if (videoUrl) {
        postData.videoUrl = videoUrl
      }
      
      // Include location if exists
      if (location) {
        postData.locationName = location.name
        postData.latitude = location.latitude
        postData.longitude = location.longitude
      }
      
      // Include scheduled time if exists
      if (scheduledDateTime) {
        postData.scheduledAt = new Date(scheduledDateTime).toISOString()
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      })

      if (response.ok) {
        setContent('')
        setMediaPreview(null)
        setImagePreviews([])
        setLocation(null)
        setScheduledDateTime('')

        // Dispatch custom event to notify SocialFeed
        window.dispatchEvent(new CustomEvent('postCreated'))

        // Also refresh router to update server-side data
        router.refresh()
      } else {
        const errorData = await response.json().catch(() => ({}))
        if (errorData?.code === 'CONTENT_BLOCKED') {
          // Set moderation error with violations and suggestions
          setModerationError({
            message: errorData?.error || 'Nội dung có chứa từ ngữ không phù hợp',
            violations: errorData?.violations || [],
            suggestions: errorData?.suggestions || [],
          })
          return // Don't throw, just show the error UI
        }
        const errorMessage = errorData.details
          ? `${errorData.error}: ${JSON.stringify(errorData.details)}`
          : errorData.error || 'Lỗi khi đăng bài'
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('Error creating post:', error)
      alert(error.message || 'Đã xảy ra lỗi khi đăng bài')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const firstFile = fileArray[0]
    const isImage = ALLOWED_IMAGE_TYPES.includes(firstFile.type)

    // Check if user has premium or admin access
    const isPremium = hasPremiumOrAdminAccess(session?.user)

    // If video, only allow one video
    if (!isImage) {
      if (fileArray.length > 1) {
        alert('Chỉ có thể đăng 1 video mỗi bài')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      const validation = validateVideo(firstFile, isPremium)
      if (!validation.valid) {
        alert(validation.error)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      const maxSize = isPremium ? MAX_VIDEO_SIZE_PREMIUM : MAX_VIDEO_SIZE_NORMAL
      const maxSizeMB = maxSize / (1024 * 1024)
      const fileSizeMB = (firstFile.size / (1024 * 1024)).toFixed(2)
      console.log(`Video đã chọn: ${fileSizeMB}MB / ${maxSizeMB}MB ${isPremium ? '(Premium)' : '(người dùng thường)'}`)

      // Create video preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setMediaPreview({
          url: reader.result as string,
          type: 'video',
          file: firstFile,
        })
        setImagePreviews([]) // Clear images if video is selected
      }
      reader.readAsDataURL(firstFile)
      return
    }

    // Handle multiple images
    const currentImagesCount = imagePreviews.length
    const totalImages = currentImagesCount + fileArray.length

    if (totalImages > MAX_IMAGES_COUNT) {
      alert(`Chỉ có thể đăng tối đa ${MAX_IMAGES_COUNT} ảnh. Bạn đang cố gắng thêm ${fileArray.length} ảnh vào ${currentImagesCount} ảnh hiện có.`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate and create previews for all images
    const newPreviews: ImagePreview[] = []
    for (const file of fileArray) {
      const validation = validateImage(file)
      if (!validation.valid) {
        alert(`${file.name}: ${validation.error}`)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      newPreviews.push({ url, file })
    }

    setImagePreviews([...imagePreviews, ...newPreviews])
    setMediaPreview(null) // Clear video if images are selected
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleMediaClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveMedia = () => {
    setMediaPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const handleImageClick = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const handleEmojiClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEmojiPicker(!showEmojiPicker)
  }

  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.emoji
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + emoji + content.substring(end)
      setContent(newContent)
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    } else {
      setContent(content + emoji)
    }
    setShowEmojiPicker(false)
  }

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('button[title="GIF"]')
      ) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Sử dụng OpenStreetMap Nominatim API (miễn phí, không cần API key)
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
        // Tạo tên địa điểm từ thông tin địa chỉ
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
      // Remove location if already set
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

  const handleScheduleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (scheduledDateTime) {
      // Remove schedule if already set
      setScheduledDateTime('')
      return
    }
    setShowScheduleModal(true)
  }

  const handleScheduleConfirm = () => {
    if (scheduledDateTime) {
      const selectedDate = new Date(scheduledDateTime)
      const now = new Date()
      
      if (selectedDate <= now) {
        alert('Thời gian đăng bài phải trong tương lai')
        return
      }
      
      setShowScheduleModal(false)
    }
  }

  const handleScheduleCancel = () => {
    setShowScheduleModal(false)
    setScheduledDateTime('')
  }

  // Close schedule modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        scheduleModalRef.current &&
        !scheduleModalRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('button[title="Schedule"]')
      ) {
        setShowScheduleModal(false)
      }
    }

    if (showScheduleModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showScheduleModal])

  // Auto-publish scheduled posts when component mounts
  useEffect(() => {
    // Call publish API to check and publish scheduled posts
    fetch('/api/posts/scheduled/publish', { method: 'POST' }).catch(console.error)
  }, [])

  const userName = session?.user?.name || 'User'
  const canSubmit = (content.trim() || mediaPreview || imagePreviews.length > 0) && !loading && !uploading
  const isScheduled = !!scheduledDateTime

  return (
    <div className="border-b border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
      <form onSubmit={handleSubmit} className="py-2">
        <div className="flex items-start space-x-3 px-4">
          <Avatar src={session?.user?.image} name={userName} size="md" />
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chuyện gì đang xảy ra?"
              rows={3}
              className="w-full bg-transparent text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 border-none outline-none resize-none text-xl font-poppins transition-colors duration-300"
            />

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-0 mb-2 z-50"
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  theme={isDarkMode ? ('dark' as any) : ('light' as any)}
                  width={350}
                  height={400}
                  searchDisabled={false}
                  skinTonesDisabled={false}
                  previewConfig={{
                    showPreview: false,
                  }}
                />
              </div>
            )}

            {/* Location Preview */}
            {location && (
              <div className="mt-3 flex items-center space-x-2 px-3 py-2 bg-bluelock-light-2 dark:bg-gray-800 rounded-full border border-bluelock-blue/30 dark:border-gray-700">
                <MapPin size={16} className="text-bluelock-green dark:text-blue-500 flex-shrink-0" />
                <span className="text-sm text-bluelock-dark dark:text-white font-poppins flex-1 truncate">
                  {location.name}
                </span>
                <button
                  type="button"
                  onClick={handleLocationClick}
                  className="text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-dark dark:hover:text-white transition-colors"
                  title="Xóa vị trí"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Schedule Preview */}
            {scheduledDateTime && (
              <div className="mt-3 flex items-center space-x-2 px-3 py-2 bg-bluelock-light-2 dark:bg-gray-800 rounded-full border border-bluelock-blue/30 dark:border-gray-700">
                <Calendar size={16} className="text-bluelock-green dark:text-blue-500 flex-shrink-0" />
                <span className="text-sm text-bluelock-dark dark:text-white font-poppins flex-1 truncate">
                  Đăng lúc: {new Date(scheduledDateTime).toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  type="button"
                  onClick={handleScheduleClick}
                  className="text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-dark dark:hover:text-white transition-colors"
                  title="Xóa lịch đăng"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Multiple Images Preview */}
            {imagePreviews.length > 0 && (
              <div className="mt-3">
                <div className={`grid gap-2 ${
                  imagePreviews.length === 1 ? 'grid-cols-1' :
                  imagePreviews.length === 2 ? 'grid-cols-2' :
                  imagePreviews.length === 3 ? 'grid-cols-3' :
                  imagePreviews.length === 4 ? 'grid-cols-2' :
                  'grid-cols-3'
                }`}>
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className={`relative rounded-2xl overflow-hidden border border-bluelock-blue/30 dark:border-gray-800 ${
                        imagePreviews.length === 1 ? 'max-h-96' : 'aspect-square'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                        title="Xóa ảnh"
                      >
                        <X size={16} />
                      </button>
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        onClick={() => handleImageClick(index)}
                        className={`w-full h-full cursor-pointer hover:opacity-90 transition-opacity ${
                          imagePreviews.length === 1 ? 'object-contain bg-bluelock-light-2 dark:bg-gray-900' : 'object-cover'
                        }`}
                      />
                    </div>
                  ))}
                </div>
                {imagePreviews.length < MAX_IMAGES_COUNT && (
                  <p className="text-xs text-bluelock-dark/60 dark:text-gray-400 mt-2 font-poppins">
                    {imagePreviews.length}/{MAX_IMAGES_COUNT} ảnh. Bạn có thể thêm {MAX_IMAGES_COUNT - imagePreviews.length} ảnh nữa.
                  </p>
                )}
              </div>
            )}

            {/* Single Video Preview */}
            {mediaPreview && (
              <div className="relative mt-3 rounded-2xl overflow-hidden border border-bluelock-blue/30 dark:border-gray-800">
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  title="Xóa video"
                >
                  <X size={18} />
                </button>
                <video
                  src={mediaPreview.url}
                  controls
                  className="w-full max-h-96 object-contain bg-bluelock-light-2 dark:bg-gray-900"
                />
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
              <div className="flex items-center space-x-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleMediaClick}
                  className="p-2 text-bluelock-green dark:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10 rounded-full transition-colors duration-300"
                  title="Đính kèm media"
                >
                  <Image size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleEmojiClick}
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    showEmojiPicker
                      ? 'bg-bluelock-green/20 dark:bg-blue-500/20 text-bluelock-green dark:text-blue-500'
                      : 'text-bluelock-green dark:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10'
                  }`}
                  title="Emoji"
                >
                  <Smile size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleLocationClick}
                  disabled={gettingLocation}
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    location
                      ? 'bg-bluelock-green/20 dark:bg-blue-500/20 text-bluelock-green dark:text-blue-500'
                      : 'text-bluelock-green dark:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10'
                  } disabled:opacity-50`}
                  title={location ? 'Xóa vị trí' : gettingLocation ? 'Đang lấy vị trí...' : 'Thêm vị trí'}
                >
                  {gettingLocation ? (
                    <div className="animate-spin">
                      <MapPin size={20} />
                    </div>
                  ) : (
                    <MapPin size={20} fill={location ? 'currentColor' : 'none'} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleScheduleClick}
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    scheduledDateTime
                      ? 'bg-bluelock-green/20 dark:bg-blue-500/20 text-bluelock-green dark:text-blue-500'
                      : 'text-bluelock-green dark:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10'
                  }`}
                  title={scheduledDateTime ? 'Xóa lịch đăng' : 'Lên lịch đăng bài'}
                >
                  <Calendar size={20} fill={scheduledDateTime ? 'currentColor' : 'none'} />
                </button>
              </div>
              <button
                type="submit"
                disabled={!canSubmit}
                className="bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white px-6 py-2.5 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
              >
                {uploading
                  ? 'Đang tải lên...'
                  : loading
                  ? isScheduled
                    ? 'Đang lên lịch...'
                    : 'Đang đăng...'
                  : isScheduled
                  ? 'Lên lịch'
                  : 'Đăng'}
              </button>
            </div>
          </div>
        </div>
      </form>

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

      {/* Image Lightbox */}
      <ImageLightbox
        images={imagePreviews.map(p => p.url)}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  )
}
