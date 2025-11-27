import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId, taskId } = await params

    // Verify task exists
    const task = await prisma.spaceTask.findFirst({
      where: {
        id: taskId,
        spaceId,
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task không tồn tại' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'image' or 'attachment'

    if (!file) {
      return NextResponse.json({ error: 'Không có file được upload' }, { status: 400 })
    }

    // Create uploads directory
    const uploadsDir = join(
      process.cwd(),
      'public',
      'uploads',
      'spaces',
      spaceId,
      'tasks',
      taskId,
      type === 'image' ? 'images' : 'attachments'
    )
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const fileExtension = originalName.split('.').pop()
    const fileName = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = join(uploadsDir, fileName)
    const fileUrl = `/uploads/spaces/${spaceId}/tasks/${taskId}/${type === 'image' ? 'images' : 'attachments'}/${fileName}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update task
    const parseJSON = (jsonString: string | null): any[] => {
      if (!jsonString) return []
      try {
        return JSON.parse(jsonString)
      } catch {
        return []
      }
    }

    if (type === 'image') {
      const images = parseJSON(task.images)
      images.push(fileUrl)
      await prisma.spaceTask.update({
        where: { id: taskId },
        data: {
          images: JSON.stringify(images),
        },
      })
    } else {
      const attachments = parseJSON(task.attachments)
      attachments.push({
        name: originalName,
        url: fileUrl,
        type: fileExtension,
        size: buffer.length,
      })
      await prisma.spaceTask.update({
        where: { id: taskId },
        data: {
          attachments: JSON.stringify(attachments),
        },
      })
    }

    return NextResponse.json({
      url: fileUrl,
      name: originalName,
      type: type === 'image' ? 'image' : 'attachment',
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi upload file' },
      { status: 500 }
    )
  }
}

