/**
 * File Validation Utilities
 *
 * Giới hạn:
 * - Video người dùng thường: dung lượng <= 50MB, không giới hạn thời lượng
 * - Video người dùng premium: dung lượng <= 100MB, không giới hạn thời lượng
 * - Ảnh: dung lượng <= 5MB
 * - Văn bản: dung lượng <= 50MB
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

// Constants
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_IMAGES_COUNT = 10 // Maximum 10 images per post
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_VIDEO_SIZE_NORMAL = 50 * 1024 * 1024 // 50MB for normal users
export const MAX_VIDEO_SIZE_PREMIUM = 100 * 1024 * 1024 // 100MB for premium users
export const MAX_VIDEO_DURATION = 5 // 5 seconds (deprecated - kept for backward compatibility)
export const MIN_VIDEO_DURATION = 0 // 0 seconds (deprecated - kept for backward compatibility)

// Allowed MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo', // AVI
]

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain',
  'text/csv',
]

/**
 * Validate image file
 */
export function validateImage(file: File): ValidationResult {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Loại file không được hỗ trợ. Chỉ chấp nhận hình ảnh (JPEG, PNG, GIF, WebP)',
    }
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Hình ảnh quá lớn. Dung lượng tối đa là ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
    }
  }

  return { valid: true }
}

/**
 * Validate video file
 * @param file - The video file to validate
 * @param isPremium - Whether the user has premium access (default: false)
 */
export function validateVideo(file: File, isPremium: boolean = false): ValidationResult {
  // Check file type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Loại file không được hỗ trợ. Chỉ chấp nhận video (MP4, WebM, OGG, MOV, AVI)',
    }
  }

  // Check file size based on user type
  const maxSize = isPremium ? MAX_VIDEO_SIZE_PREMIUM : MAX_VIDEO_SIZE_NORMAL
  const maxSizeMB = maxSize / (1024 * 1024)

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Video quá lớn. Dung lượng tối đa là ${maxSizeMB}MB ${isPremium ? '(Premium)' : '(người dùng thường)'}`,
    }
  }

  return { valid: true }
}

/**
 * Validate document file
 */
export function validateDocument(file: File): ValidationResult {
  // Check file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Loại file không được hỗ trợ. Chỉ chấp nhận văn bản (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV)',
    }
  }

  // Check file size
  if (file.size > MAX_DOCUMENT_SIZE) {
    return {
      valid: false,
      error: `Văn bản quá lớn. Dung lượng tối đa là ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB`,
    }
  }

  return { valid: true }
}

/**
 * Get video duration from file (client-side only)
 * This should be called from the browser using HTML5 video element
 */
export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src)
      reject(new Error('Không thể đọc thông tin video'))
    }
    
    video.src = URL.createObjectURL(file)
  })
}

/**
 * Validate video duration (client-side)
 */
export async function validateVideoDuration(file: File): Promise<ValidationResult> {
  try {
    const duration = await getVideoDuration(file)
    
    if (duration < MIN_VIDEO_DURATION || duration > MAX_VIDEO_DURATION) {
      return {
        valid: false,
        error: `Thời lượng video phải từ ${MIN_VIDEO_DURATION}s đến ${MAX_VIDEO_DURATION}s. Video hiện tại: ${duration.toFixed(2)}s`,
      }
    }
    
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: 'Không thể đọc thông tin video. Vui lòng thử lại với video khác.',
    }
  }
}

/**
 * Auto-detect file type and validate
 * @param file - The file to validate
 * @param fileType - The type of file ('image' | 'video' | 'document')
 * @param isPremium - Whether the user has premium access (only used for video validation)
 */
export function validateFile(file: File, fileType: 'image' | 'video' | 'document', isPremium: boolean = false): ValidationResult {
  switch (fileType) {
    case 'image':
      return validateImage(file)
    case 'video':
      return validateVideo(file, isPremium)
    case 'document':
      return validateDocument(file)
    default:
      return {
        valid: false,
        error: 'Loại file không được xác định',
      }
  }
}

