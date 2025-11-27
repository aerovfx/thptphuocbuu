import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params

    // Get space info for matching
    const currentSpace = await prisma.space.findUnique({
      where: { id: spaceId },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
      },
    })

    if (!currentSpace) {
      return NextResponse.json({ error: 'Space không tồn tại' }, { status: 404 })
    }

    // Get departments in this space
    const spaceDepartments = await prisma.department.findMany({
      where: { spaceId },
      select: {
        id: true,
        name: true,
        code: true,
        subject: true,
      },
    })

    // Get space documents
    const spaceDocuments = await prisma.spaceDocument.findMany({
      where: { spaceId },
      include: {
        space: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    })

    // Fetch document details with relevance scoring
    const documentsWithDetails = await Promise.all(
      spaceDocuments.map(async (spaceDoc) => {
        try {
          let doc: any = null
          let relevanceScore = 0 // Điểm phù hợp

          if (spaceDoc.documentType === 'INCOMING') {
            doc = await prisma.incomingDocument.findUnique({
              where: { id: spaceDoc.documentId },
              include: {
                createdBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            })

            if (doc) {
              // Tính điểm phù hợp
              const title = doc.title?.toLowerCase() || ''
              const sender = doc.sender?.toLowerCase() || ''
              
              // Kiểm tra tên space trong title/sender
              if (currentSpace) {
                const spaceName = currentSpace.name.toLowerCase()
                const spaceCode = currentSpace.code.toLowerCase()
                if (title.includes(spaceName) || title.includes(spaceCode)) {
                  relevanceScore += 10
                }
                if (sender.includes(spaceName) || sender.includes(spaceCode)) {
                  relevanceScore += 5
                }
              }

              // Kiểm tra tên department trong title/sender
              spaceDepartments.forEach((dept) => {
                const deptName = dept.name.toLowerCase()
                const deptCode = dept.code.toLowerCase()
                const deptSubject = dept.subject?.toLowerCase() || ''
                
                if (title.includes(deptName) || title.includes(deptCode)) {
                  relevanceScore += 8
                }
                if (title.includes(deptSubject) && deptSubject) {
                  relevanceScore += 6
                }
                if (sender.includes(deptName) || sender.includes(deptCode)) {
                  relevanceScore += 4
                }
              })
            }
          } else {
            doc = await prisma.outgoingDocument.findUnique({
              where: { id: spaceDoc.documentId },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                documentNumber: true,
                recipient: true,
                sendDate: true,
                createdAt: true,
                updatedAt: true,
                targetSpaces: true,
                createdBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            })

            if (doc) {
              // Tính điểm phù hợp
              const title = doc.title?.toLowerCase() || ''
              const recipient = doc.recipient?.toLowerCase() || ''
              
              // Kiểm tra targetSpaces có chứa spaceId này không
              if (doc.targetSpaces) {
                try {
                  const targetSpaces = typeof doc.targetSpaces === 'string' 
                    ? JSON.parse(doc.targetSpaces) 
                    : doc.targetSpaces
                  if (Array.isArray(targetSpaces) && targetSpaces.includes(spaceId)) {
                    relevanceScore += 15 // Ưu tiên cao nhất
                  }
                } catch (e) {
                  // Ignore parse error
                }
              }

              // Kiểm tra tên space trong title/recipient
              if (currentSpace) {
                const spaceName = currentSpace.name.toLowerCase()
                const spaceCode = currentSpace.code.toLowerCase()
                if (title.includes(spaceName) || title.includes(spaceCode)) {
                  relevanceScore += 10
                }
                if (recipient.includes(spaceName) || recipient.includes(spaceCode)) {
                  relevanceScore += 5
                }
              }

              // Kiểm tra tên department trong title/recipient
              spaceDepartments.forEach((dept) => {
                const deptName = dept.name.toLowerCase()
                const deptCode = dept.code.toLowerCase()
                const deptSubject = dept.subject?.toLowerCase() || ''
                
                if (title.includes(deptName) || title.includes(deptCode)) {
                  relevanceScore += 8
                }
                if (title.includes(deptSubject) && deptSubject) {
                  relevanceScore += 6
                }
                if (recipient.includes(deptName) || recipient.includes(deptCode)) {
                  relevanceScore += 4
                }
              })
            }
          }

          return {
            id: spaceDoc.id,
            documentId: spaceDoc.documentId,
            documentType: spaceDoc.documentType,
            assignedAt: spaceDoc.assignedAt.toISOString(),
            visibility: 'INTERNAL',
            relevanceScore, // Thêm điểm phù hợp
            document: doc
              ? {
                  ...doc,
                  receivedDate: doc.receivedDate?.toISOString() || null,
                  deadline: doc.deadline?.toISOString() || null,
                  sendDate: doc.sendDate?.toISOString() || null,
                  createdAt: doc.createdAt.toISOString(),
                  updatedAt: doc.updatedAt.toISOString(),
                }
              : null,
          }
        } catch (docError: any) {
          console.error(`Error fetching document ${spaceDoc.documentId} (${spaceDoc.documentType}):`, docError)
          return {
            id: spaceDoc.id,
            documentId: spaceDoc.documentId,
            documentType: spaceDoc.documentType,
            assignedAt: spaceDoc.assignedAt.toISOString(),
            visibility: 'INTERNAL',
            relevanceScore: 0,
            document: null,
          }
        }
      })
    )

    // Filter out null documents
    const validDocuments = documentsWithDetails.filter((d) => d.document !== null)

    // Sắp xếp theo điểm phù hợp (cao nhất trước), sau đó theo thời gian
    validDocuments.sort((a, b) => {
      // Ưu tiên điểm phù hợp
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      // Nếu điểm bằng nhau, sắp xếp theo thời gian (mới nhất trước)
      return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
    })

    return NextResponse.json(validDocuments)
  } catch (error: any) {
    console.error('Error fetching space documents:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error name:', error?.name)
    console.error('Error code:', error?.code)
    const errorMessage = error?.message || 'Đã xảy ra lỗi khi lấy danh sách văn bản'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
          code: error?.code,
        } : undefined
      },
      { status: 500 }
    )
  }
}

