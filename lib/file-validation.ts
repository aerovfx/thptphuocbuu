/**
 * File Validation Utilities
 * 
 * Giới hạn:
 * - Video: thời lượng 0-5s
 * - Ảnh: dung lượng <= 5MB
 * - Văn bản: dung lượng <= 10MB
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

// Constants
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_VIDEO_DURATION = 5 // 5 seconds
export const MIN_VIDEO_DURATION = 0 // 0 seconds

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
 * Note: Duration validation requires client-side or server-side video processing
 * For now, we only validate file size and type
 */
export function validateVideo(file: File): ValidationResult {
  // Check file type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Loại file không được hỗ trợ. Chỉ chấp nhận video (MP4, WebM, OGG, MOV, AVI)',
    }
  }

  // Note: Video duration validation should be done client-side using HTML5 video element
  // or server-side using ffmpeg/ffprobe. For now, we'll rely on client-side validation
  // and add a reasonable size limit as a proxy (5MB for 5 seconds of video)
  const estimatedMaxSize = 5 * 1024 * 1024 // 5MB as a reasonable limit for 5s video
  if (file.size > estimatedMaxSize) {
    return {
      valid: false,
      error: `Video quá lớn. Vui lòng chọn video có thời lượng từ ${MIN_VIDEO_DURATION}s đến ${MAX_VIDEO_DURATION}s`,
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
 */
export function validateFile(file: File, fileType: 'image' | 'video' | 'document'): ValidationResult {
  switch (fileType) {
    case 'image':
      return validateImage(file)
    case 'video':
      return validateVideo(file)
    case 'document':
      return validateDocument(file)
    default:
      return {
        valid: false,
        error: 'Loại file không được xác định',
      }
  }
}

