import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFileFromFormData } from '@/lib/storage'

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

    // Upload to Google Cloud Storage
    const folder = `spaces/${spaceId}/tasks/${taskId}/${type === 'image' ? 'images' : 'attachments'}`
    const result = await uploadFileFromFormData(file, folder, {
      public: true,
      cacheControl: 'public, max-age=31536000',
    })

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
      images.push(result.publicUrl)
      await prisma.spaceTask.update({
        where: { id: taskId },
        data: {
          images: JSON.stringify(images),
        },
      })
    } else {
      const attachments = parseJSON(task.attachments)
      attachments.push({
        name: file.name,
        url: result.publicUrl,
        type: file.name.split('.').pop(),
        size: result.size,
      })
      await prisma.spaceTask.update({
        where: { id: taskId },
        data: {
          attachments: JSON.stringify(attachments),
        },
      })
    }

    return NextResponse.json({
      url: result.publicUrl,
      name: file.name,
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

