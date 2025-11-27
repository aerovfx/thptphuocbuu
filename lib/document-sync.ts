/**
 * Document Synchronization Service
 * Quản lý đồng bộ văn bản giữa Space, Department và DMS
 */

import { prisma } from './prisma'

export type DocumentType = 'INCOMING' | 'OUTGOING'

interface SyncDocumentParams {
  documentId: string
  documentType: DocumentType
  spaceIds?: string[]
  departmentIds?: string[]
  removeFromSpaces?: string[]
  removeFromDepartments?: string[]
}

/**
 * Đồng bộ văn bản với Spaces và Departments
 */
export async function syncDocumentToSpacesAndDepartments({
  documentId,
  documentType,
  spaceIds = [],
  departmentIds = [],
  removeFromSpaces = [],
  removeFromDepartments = [],
}: SyncDocumentParams) {
  try {
    // 1. Thêm văn bản vào Spaces
    if (spaceIds.length > 0) {
      await Promise.all(
        spaceIds.map((spaceId) =>
          prisma.spaceDocument.upsert({
            where: {
              spaceId_documentId_documentType: {
                spaceId,
                documentId,
                documentType,
              },
            },
            update: {
              // Cập nhật lại thời gian nếu đã tồn tại
              assignedAt: new Date(),
            },
            create: {
              spaceId,
              documentId,
              documentType,
            },
          })
        )
      )
    }

    // 2. Xóa văn bản khỏi Spaces (nếu có)
    if (removeFromSpaces.length > 0) {
      await prisma.spaceDocument.deleteMany({
        where: {
          documentId,
          documentType,
          spaceId: {
            in: removeFromSpaces,
          },
        },
      })
    }

    // 3. Thêm văn bản vào Departments
    if (departmentIds.length > 0) {
      await Promise.all(
        departmentIds.map((departmentId) =>
          prisma.departmentDocument.upsert({
            where: {
              departmentId_documentId_documentType: {
                departmentId,
                documentId,
                documentType,
              },
            },
            update: {
              assignedAt: new Date(),
            },
            create: {
              departmentId,
              documentId,
              documentType,
            },
          })
        )
      )
    }

    // 4. Xóa văn bản khỏi Departments (nếu có)
    if (removeFromDepartments.length > 0) {
      await prisma.departmentDocument.deleteMany({
        where: {
          documentId,
          documentType,
          departmentId: {
            in: removeFromDepartments,
          },
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error syncing document to spaces/departments:', error)
    throw error
  }
}

/**
 * Tính điểm phù hợp của văn bản với space/department dựa trên tag
 */
async function calculateDocumentRelevance(
  title: string,
  sender: string | null,
  recipient: string | null,
  spaceName: string,
  spaceCode: string,
  deptNames: string[],
  deptCodes: string[],
  deptSubjects: string[]
): Promise<number> {
  const lowerText = (title + ' ' + (sender || '') + ' ' + (recipient || '')).toLowerCase()
  const lowerSpaceName = spaceName.toLowerCase()
  const lowerSpaceCode = spaceCode.toLowerCase()
  let score = 0

  // Kiểm tra tên space (ưu tiên cao)
  if (lowerText.includes(lowerSpaceName)) {
    score += 10
  }
  if (lowerText.includes(lowerSpaceCode)) {
    score += 8
  }

  // Kiểm tra tên department
  deptNames.forEach((deptName) => {
    if (lowerText.includes(deptName.toLowerCase())) {
      score += 8
    }
  })

  deptCodes.forEach((deptCode) => {
    if (lowerText.includes(deptCode.toLowerCase())) {
      score += 6
    }
  })

  // Kiểm tra subject
  deptSubjects.forEach((subject) => {
    if (subject && lowerText.includes(subject.toLowerCase())) {
      score += 6
    }
  })

  return score
}

/**
 * Tự động đồng bộ văn bản dựa trên targetSpaces, department của người tạo, và tag matching
 * Phân loại và ưu tiên văn bản theo tag (tên space/tổ trong title, sender, recipient)
 */
export async function autoSyncDocument(
  documentId: string,
  documentType: DocumentType,
  createdById: string,
  targetSpaces?: string | null
) {
  try {
    // 1. Lấy thông tin văn bản để tính điểm phù hợp
    let docTitle = ''
    let docSender: string | null = null
    let docRecipient: string | null = null

    if (documentType === 'INCOMING') {
      const doc = await prisma.incomingDocument.findUnique({
        where: { id: documentId },
        select: {
          title: true,
          sender: true,
        },
      })
      if (doc) {
        docTitle = doc.title || ''
        docSender = doc.sender
      }
    } else {
      const doc = await prisma.outgoingDocument.findUnique({
        where: { id: documentId },
        select: {
          title: true,
          recipient: true,
        },
      })
      if (doc) {
        docTitle = doc.title || ''
        docRecipient = doc.recipient
      }
    }

    // 2. Parse targetSpaces (có thể là JSON string hoặc null)
    let spaceIds: string[] = []
    if (targetSpaces) {
      try {
        const parsed = typeof targetSpaces === 'string' ? JSON.parse(targetSpaces) : targetSpaces
        spaceIds = Array.isArray(parsed) ? parsed : []
      } catch (e) {
        console.warn('Failed to parse targetSpaces:', targetSpaces)
      }
    }

    // 3. Tìm tất cả spaces và tính điểm phù hợp
    const allSpaces = await prisma.space.findMany({
      where: {
        isActive: true,
      },
      include: {
        departments: {
          select: {
            name: true,
            code: true,
            subject: true,
          },
        },
      },
    })

    const spaceMatches: Array<{ spaceId: string; score: number }> = []

    for (const space of allSpaces) {
      const deptNames = space.departments.map((d) => d.name)
      const deptCodes = space.departments.map((d) => d.code)
      const deptSubjects = space.departments
        .map((d) => d.subject)
        .filter((s): s is string => s !== null)

      const score = await calculateDocumentRelevance(
        docTitle,
        docSender,
        docRecipient,
        space.name,
        space.code,
        deptNames,
        deptCodes,
        deptSubjects
      )

      // Ưu tiên targetSpaces (thêm điểm)
      if (spaceIds.includes(space.id)) {
        spaceMatches.push({ spaceId: space.id, score: score + 20 })
      } else if (score > 0) {
        spaceMatches.push({ spaceId: space.id, score })
      }
    }

    // Sắp xếp theo điểm và lấy top 3
    spaceMatches.sort((a, b) => b.score - a.score)
    const topSpaces = spaceMatches.slice(0, 3).map((m) => m.spaceId)

    // 4. Luôn thêm vào Space "Văn bản" (VAN_BAN_SPACE)
    const vanBanSpace = await prisma.space.findFirst({
      where: {
        code: 'VAN_BAN_SPACE',
      },
      select: {
        id: true,
      },
    })

    if (vanBanSpace && !topSpaces.includes(vanBanSpace.id)) {
      topSpaces.push(vanBanSpace.id)
    }

    // 5. Tìm departments của người tạo
    const userDepartments = await prisma.departmentMember.findMany({
      where: {
        userId: createdById,
        isActive: true,
      },
      select: {
        departmentId: true,
      },
    })
    let departmentIds = userDepartments.map((dm) => dm.departmentId)

    // 6. Tìm departments phù hợp dựa trên tag
    const allDepartments = await prisma.department.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        subject: true,
      },
    })

    const deptMatches: Array<{ deptId: string; score: number }> = []

    for (const dept of allDepartments) {
      const lowerText = (docTitle + ' ' + (docSender || '') + ' ' + (docRecipient || '')).toLowerCase()
      const lowerDeptName = dept.name.toLowerCase()
      const lowerDeptCode = dept.code.toLowerCase()
      const lowerDeptSubject = dept.subject?.toLowerCase() || ''
      let score = 0

      if (lowerText.includes(lowerDeptName)) score += 10
      if (lowerText.includes(lowerDeptCode)) score += 8
      if (lowerDeptSubject && lowerText.includes(lowerDeptSubject)) score += 6

      // Ưu tiên department của người tạo
      if (departmentIds.includes(dept.id)) {
        score += 5
      }

      if (score > 0) {
        deptMatches.push({ deptId: dept.id, score })
      }
    }

    // Sắp xếp và lấy top 5
    deptMatches.sort((a, b) => b.score - a.score)
    const topDepartments = deptMatches.slice(0, 5).map((m) => m.deptId)

    // Kết hợp với departments của người tạo
    topDepartments.forEach((deptId) => {
      if (!departmentIds.includes(deptId)) {
        departmentIds.push(deptId)
      }
    })

    // 7. Tìm spaces của các departments
    if (departmentIds.length > 0) {
      const departmentSpaces = await prisma.department.findMany({
        where: {
          id: {
            in: departmentIds,
          },
          spaceId: {
            not: null,
          },
        },
        select: {
          spaceId: true,
        },
      })

      const deptSpaceIds = departmentSpaces
        .map((d) => d.spaceId)
        .filter((id): id is string => id !== null)

      // Thêm spaces của departments vào danh sách
      deptSpaceIds.forEach((spaceId) => {
        if (!topSpaces.includes(spaceId)) {
          topSpaces.push(spaceId)
        }
      })
    }

    // 8. Đồng bộ với spaces và departments
    if (topSpaces.length > 0 || departmentIds.length > 0) {
      await syncDocumentToSpacesAndDepartments({
        documentId,
        documentType,
        spaceIds: topSpaces,
        departmentIds,
      })
    }

    return { spaceIds: topSpaces, departmentIds }
  } catch (error) {
    console.error('Error auto-syncing document:', error)
    throw error
  }
}

/**
 * Đồng bộ văn bản với space của department
 * Khi văn bản được gắn với department, tự động gắn với space của department đó
 */
export async function syncDocumentWithDepartmentSpace(
  documentId: string,
  documentType: DocumentType,
  departmentId: string
) {
  try {
    // Tìm department và space của nó
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: {
        spaceId: true,
      },
    })

    if (department && department.spaceId) {
      // Đồng bộ với space của department
      await syncDocumentToSpacesAndDepartments({
        documentId,
        documentType,
        spaceIds: [department.spaceId],
        departmentIds: [departmentId],
      })
    } else {
      // Chỉ đồng bộ với department
      await syncDocumentToSpacesAndDepartments({
        documentId,
        documentType,
        departmentIds: [departmentId],
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error syncing document with department space:', error)
    throw error
  }
}

/**
 * Lấy tất cả spaces và departments mà văn bản đang được gắn
 */
export async function getDocumentSpacesAndDepartments(
  documentId: string,
  documentType: DocumentType
) {
  try {
    const [spaces, departments] = await Promise.all([
      prisma.spaceDocument.findMany({
        where: {
          documentId,
          documentType,
        },
        include: {
          space: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
              visibility: true,
            },
          },
        },
      }),
      prisma.departmentDocument.findMany({
        where: {
          documentId,
          documentType,
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
        },
      }),
    ])

    return {
      spaces: spaces.map((sd) => sd.space),
      departments: departments.map((dd) => dd.department),
    }
  } catch (error) {
    console.error('Error getting document spaces and departments:', error)
    throw error
  }
}

/**
 * Xóa tất cả liên kết của văn bản với spaces và departments
 */
export async function removeDocumentFromAllSpacesAndDepartments(
  documentId: string,
  documentType: DocumentType
) {
  try {
    await Promise.all([
      prisma.spaceDocument.deleteMany({
        where: {
          documentId,
          documentType,
        },
      }),
      prisma.departmentDocument.deleteMany({
        where: {
          documentId,
          documentType,
        },
      }),
    ])

    return { success: true }
  } catch (error) {
    console.error('Error removing document from all spaces/departments:', error)
    throw error
  }
}

