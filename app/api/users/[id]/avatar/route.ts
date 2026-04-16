import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFileFromFormData, deleteFile } from '@/lib/storage'

async function resolveCurrentUserId(session: any): Promise<string | null> {
  const id = session?.user?.id
  const email = session?.user?.email

  if (typeof id === 'string' && id.trim()) {
    const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (exists) return id
  }

  if (typeof email === 'string' && email.trim()) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    return user?.id || null
  }

  return null
}

// GET handler to retrieve avatar URL or redirect to actual image
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get user avatar from database
    const user = await prisma.user.findUnique({
      where: { id },
      select: { avatar: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If user has an avatar URL, redirect to it
    if (user.avatar) {
      // If it's already a full URL (GCS URL), redirect to it
      if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
        return NextResponse.redirect(user.avatar)
      }
      // If it's a relative path, construct full URL
      // This shouldn't happen if avatars are stored as full GCS URLs
      return NextResponse.json({ avatar: user.avatar })
    }

    // No avatar found
    return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
  } catch (error) {
    console.error('Error fetching avatar:', error)
    return NextResponse.json(
      { error: 'Failed to fetch avatar' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Avatar Upload] Starting upload process...')
    
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('[Avatar Upload] No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    console.log('[Avatar Upload] User ID from params:', id)
    console.log('[Avatar Upload] Session user ID:', session.user?.id)
    console.log('[Avatar Upload] Session user role:', session.user?.role)

    // Check if session has user ID
    if (!session.user?.id) {
      console.log('[Avatar Upload] Session missing user ID')
      return NextResponse.json(
        { error: 'Session không hợp lệ. Vui lòng đăng nhập lại.' },
        { status: 401 }
      )
    }

    const currentUserId = session.user.id
    const role = session.user.role
    const isPrivileged =
      role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'BGH'

    // Only allow users to update their own avatar (or privileged roles)
    // Same logic as cover photo route
    if (currentUserId !== id && !isPrivileged) {
      console.log('[Avatar Upload] Forbidden: currentUserId:', currentUserId, 'targetId:', id, 'role:', role, 'isPrivileged:', isPrivileged)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('[Avatar Upload] Permission granted')

    console.log('[Avatar Upload] Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('[Avatar Upload] No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('[Avatar Upload] File info:', {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('[Avatar Upload] Invalid file type:', file.type)
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.log('[Avatar Upload] File too large:', file.size, 'max:', maxSize)
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Get current user to delete old avatar
    console.log('[Avatar Upload] Fetching current user...')
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { avatar: true },
    })

    if (!currentUser) {
      console.log('[Avatar Upload] User not found:', id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete old avatar from GCS if exists
    if (currentUser?.avatar && currentUser.avatar.includes('storage.googleapis.com')) {
      console.log('[Avatar Upload] Deleting old avatar:', currentUser.avatar)
      try {
      // Extract path from GCS URL
      const urlParts = currentUser.avatar.split('/')
      const pathIndex = urlParts.findIndex(part => part === (process.env.GCS_BUCKET_NAME || 'gen-lang-client-0753799782_cloudbuild'))
      if (pathIndex !== -1) {
        const oldPath = urlParts.slice(pathIndex + 1).join('/')
        await deleteFile(oldPath)
          console.log('[Avatar Upload] Old avatar deleted:', oldPath)
        }
      } catch (deleteError) {
        console.error('[Avatar Upload] Error deleting old avatar (continuing anyway):', deleteError)
        // Continue even if deletion fails
      }
    }

    // Upload to Google Cloud Storage
    console.log('[Avatar Upload] Uploading to GCS...')
    let result
    try {
      result = await uploadFileFromFormData(file, 'avatars', {
      public: true,
      cacheControl: 'public, max-age=31536000',
    })
      console.log('[Avatar Upload] Upload successful:', result.publicUrl)
    } catch (uploadError) {
      console.error('[Avatar Upload] GCS upload error:', uploadError)
      return NextResponse.json(
        { error: `Lỗi khi upload file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    if (!result || !result.publicUrl) {
      console.error('[Avatar Upload] Upload result missing publicUrl')
      return NextResponse.json(
        { error: 'Upload thành công nhưng không nhận được URL' },
        { status: 500 }
      )
    }

    // Update user avatar in database
    console.log('[Avatar Upload] Updating database...')
    try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { avatar: result.publicUrl },
      select: {
        id: true,
        avatar: true,
      },
    })
      console.log('[Avatar Upload] Database updated successfully:', updatedUser.avatar)

      return NextResponse.json({ 
        success: true,
        avatar: updatedUser.avatar, 
        url: result.publicUrl 
      })
    } catch (dbError) {
      console.error('[Avatar Upload] Database update error:', dbError)
      return NextResponse.json(
        { error: `Lỗi khi cập nhật database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Avatar Upload] Unexpected error:', error)
    console.error('[Avatar Upload] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { 
        error: `Đã xảy ra lỗi: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}

