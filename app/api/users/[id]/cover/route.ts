import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { validateImage } from '@/lib/file-validation'

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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'covers')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}-${randomStr}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/covers/${fileName}`

    // Update user cover photo in database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { coverPhoto: fileUrl },
      select: {
        id: true,
        coverPhoto: true,
      },
    })

    return NextResponse.json({ coverPhoto: updatedUser.coverPhoto, url: fileUrl })
  } catch (error) {
    console.error('Error uploading cover photo:', error)
    return NextResponse.json(
      { error: 'Failed to upload cover photo' },
      { status: 500 }
    )
  }
}

