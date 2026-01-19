import { Storage } from '@google-cloud/storage'
import { Readable } from 'stream'

// Initialize Google Cloud Storage client
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'in360project',
  // Use service account key if provided, otherwise use default credentials
  ...(process.env.GOOGLE_APPLICATION_CREDENTIALS && {
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  }),
})

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'thptphuocbuu-dms'
const bucket = storage.bucket(BUCKET_NAME)

// Ensure bucket exists and is accessible
export async function ensureBucket() {
  try {
    const [exists] = await bucket.exists()
    if (!exists) {
      console.warn(`Bucket ${BUCKET_NAME} does not exist. Please create it first.`)
      return false
    }
    return true
  } catch (error) {
    console.error('Error checking bucket:', error)
    return false
  }
}

export interface UploadOptions {
  folder?: string
  public?: boolean
  contentType?: string
  cacheControl?: string
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
}

function sanitizeFolder(folder: string) {
  const cleaned = (folder || '').trim().replace(/^\/+/, '').replace(/\/+$/, '')
  if (!cleaned) return ''
  if (cleaned.includes('..')) {
    throw new Error('Invalid folder')
  }
  if (!/^[a-zA-Z0-9/_-]+$/.test(cleaned)) {
    throw new Error('Invalid folder')
  }
  return cleaned
}

export function generateGcsObjectPath(fileName: string, folder: string = ''): string {
  const timestamp = Date.now()
  const sanitizedFileName = sanitizeFileName(fileName)
  const safeFolder = sanitizeFolder(folder)
  return safeFolder ? `${safeFolder}/${timestamp}-${sanitizedFileName}` : `${timestamp}-${sanitizedFileName}`
}

/**
 * Upload a file buffer to Google Cloud Storage
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  options: UploadOptions = {}
): Promise<{ url: string; publicUrl: string; path: string }> {
  const { folder = '', public: isPublic = true, contentType, cacheControl = 'public, max-age=31536000' } = options

  // Generate file path
  const filePath = generateGcsObjectPath(fileName, folder)

  // Create file reference
  const file = bucket.file(filePath)

  // Upload buffer
  await file.save(buffer, {
    metadata: {
      contentType: contentType || 'application/octet-stream',
      cacheControl,
    },
    public: isPublic,
  })

  // Make file publicly accessible if needed
  if (isPublic) {
    await file.makePublic()
  }

  // Get public URL
  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`

  return {
    url: `/${filePath}`, // Relative path for backward compatibility
    publicUrl, // Full public URL
    path: filePath,
  }
}

/**
 * Upload a file from FormData File object
 */
export async function uploadFileFromFormData(
  file: File,
  folder: string = '',
  options: Omit<UploadOptions, 'folder'> = {}
): Promise<{ url: string; publicUrl: string; path: string; size: number; mimeType: string }> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const result = await uploadFile(buffer, file.name, {
    ...options,
    folder,
    contentType: file.type || options.contentType,
  })

  return {
    ...result,
    size: buffer.length,
    mimeType: file.type,
  }
}

/**
 * Create a V4 signed URL for direct uploads to GCS (PUT).
 * Useful for large uploads on Cloud Run (request size limits).
 */
export async function createSignedUploadUrl(params: {
  fileName: string
  folder?: string
  contentType: string
  expiresInSeconds?: number
}): Promise<{ uploadUrl: string; publicUrl: string; path: string }> {
  const {
    fileName,
    folder = '',
    contentType,
    expiresInSeconds = 15 * 60, // 15 minutes
  } = params

  const filePath = generateGcsObjectPath(fileName, folder)
  const file = bucket.file(filePath)

  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiresInSeconds * 1000,
    contentType: contentType || 'application/octet-stream',
  })

  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`
  return { uploadUrl, publicUrl, path: filePath }
}

/**
 * Finalize a direct upload: set metadata and optionally make the file public.
 */
export async function finalizeUploadedFile(params: {
  path: string
  public?: boolean
  contentType?: string
  cacheControl?: string
}): Promise<{ publicUrl: string; path: string }> {
  const cleanPath = params.path.startsWith('/') ? params.path.slice(1) : params.path
  if (!cleanPath || cleanPath.includes('..')) {
    throw new Error('Invalid path')
  }

  const file = bucket.file(cleanPath)
  const [exists] = await file.exists()
  if (!exists) {
    throw new Error('Uploaded file not found')
  }

  const metadata: any = {}
  if (params.contentType) metadata.contentType = params.contentType
  if (params.cacheControl) metadata.cacheControl = params.cacheControl
  if (Object.keys(metadata).length) {
    await file.setMetadata(metadata)
  }

  if (params.public !== false) {
    await file.makePublic()
  }

  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${cleanPath}`
  return { publicUrl, path: cleanPath }
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath

    const file = bucket.file(cleanPath)
    const [exists] = await file.exists()

    if (!exists) {
      console.warn(`File ${cleanPath} does not exist`)
      return false
    }

    await file.delete()
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

/**
 * Get public URL for a file path
 */
export function getPublicUrl(filePath: string): string {
  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
  return `https://storage.googleapis.com/${BUCKET_NAME}/${cleanPath}`
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
    const file = bucket.file(cleanPath)
    const [exists] = await file.exists()
    return exists
  } catch (error) {
    console.error('Error checking file existence:', error)
    return false
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(filePath: string) {
  try {
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
    const file = bucket.file(cleanPath)
    const [exists] = await file.exists()

    if (!exists) {
      return null
    }

    const [metadata] = await file.getMetadata()
    return metadata
  } catch (error) {
    console.error('Error getting file metadata:', error)
    return null
  }
}

