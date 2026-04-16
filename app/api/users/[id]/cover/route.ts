import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateImage } from '@/lib/file-validation'
import { uploadFileFromFormData, deleteFile } from '@/lib/storage'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Only allow users to update their own cover photo
    if (session.user.id !== id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type and size
    const validation = validateImage(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Get current user to delete old cover photo
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { coverPhoto: true },
    })

    // Delete old cover photo from GCS if exists
    if (currentUser?.coverPhoto && currentUser.coverPhoto.includes('storage.googleapis.com')) {
      // Extract path from GCS URL
      const urlParts = currentUser.coverPhoto.split('/')
      const pathIndex = urlParts.findIndex(part => part === (process.env.GCS_BUCKET_NAME || 'gen-lang-client-0753799782_cloudbuild'))
      if (pathIndex !== -1) {
        const oldPath = urlParts.slice(pathIndex + 1).join('/')
        await deleteFile(oldPath)
      }
    }

    // Upload to Google Cloud Storage
    const result = await uploadFileFromFormData(file, 'covers', {
      public: true,
      cacheControl: 'public, max-age=31536000',
    })

    // Update user cover photo in database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { coverPhoto: result.publicUrl },
      select: {
        id: true,
        coverPhoto: true,
      },
    })

    return NextResponse.json({ coverPhoto: updatedUser.coverPhoto, url: result.publicUrl })
  } catch (error) {
    console.error('Error uploading cover photo:', error)
    return NextResponse.json(
      { error: 'Failed to upload cover photo' },
      { status: 500 }
    )
  }
}

