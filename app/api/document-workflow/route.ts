/**
 * Document Workflow API Routes
 * Jira-style document management endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  DocumentWorkflowStatus,
  DocumentPriority,
  DocumentDirection,
  DocumentTypeCode
} from "@/types/document-workflow";

// GET /api/document-workflow - List documents with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get("spaceId");
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status") as DocumentWorkflowStatus | null;
    const priority = searchParams.get("priority") as DocumentPriority | null;
    const assignedToId = searchParams.get("assignedToId");
    const direction = searchParams.get("direction") as DocumentDirection | null;
    const documentType = searchParams.get("documentType") as DocumentTypeCode | null;
    const search = searchParams.get("search");
    const dueDate = searchParams.get("dueDate");

    // Build where clause
    const where: any = {};

    if (spaceId) {
      // Filter by space - documents assigned to this space
      where.OR = [
        {
          outgoingDocument: {
            targetSpaces: {
              contains: spaceId
            }
          }
        },
        {
          incomingDocument: {
            assignments: {
              some: {
                assignedTo: {
                  spaceMembers: {
                    some: {
                      spaceId
                    }
                  }
                }
              }
            }
          }
        }
      ];
    }

    if (departmentId) {
      where.OR = [
        ...(where.OR || []),
        {
          outgoingDocument: {
            createdBy: {
              departmentMembers: {
                some: {
                  departmentId
                }
              }
            }
          }
        }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (direction) {
      where.direction = direction;
    }

    if (documentType) {
      where.documentType = documentType;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive"
      };
    }

    if (dueDate) {
      const date = new Date(dueDate);
      where.dueDate = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999))
      };
    }

    // Fetch documents (using a virtual table concept or create actual table)
    // For now, we'll query from both incoming and outgoing documents
    const [incomingDocs, outgoingDocs] = await Promise.all([
      prisma.incomingDocument.findMany({
        where: {
          // Note: status filtering temporarily disabled due to enum mismatch
          // TODO: Map DocumentWorkflowStatus to DocumentStatus
          ...(priority && { priority }),
          ...(search && {
            title: {
              contains: search,
              mode: "insensitive"
            }
          }),
          ...(documentType && { documentTypeCode: documentType })
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          },
          assignments: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.outgoingDocument.findMany({
        where: {
          // Note: status filtering temporarily disabled due to enum mismatch
          // TODO: Map DocumentWorkflowStatus to DocumentStatus
          ...(priority && { priority }),
          ...(search && {
            title: {
              contains: search,
              mode: "insensitive"
            }
          }),
          ...(documentType && { documentTypeCode: documentType })
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true
                }
              }
            },
            orderBy: {
              level: "asc"
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    ]);

    // Transform to workflow items
    const workflowItems = [
      ...incomingDocs.map(doc => ({
        id: `incoming-${doc.id}`,
        documentNumber: doc.documentNumber,
        title: doc.title,
        content: doc.content,
        summary: doc.summary,
        direction: DocumentDirection.INCOMING,
        documentType: doc.documentTypeCode as DocumentTypeCode,
        status: doc.status as DocumentWorkflowStatus,
        priority: doc.priority as DocumentPriority,
        position: 1000, // Default position
        assignedToId: doc.assignments[0]?.assignedToId,
        assignedTo: doc.assignments[0]?.assignedTo ? {
          id: doc.assignments[0].assignedTo.id,
          firstName: doc.assignments[0].assignedTo.firstName,
          lastName: doc.assignments[0].assignedTo.lastName,
          email: doc.assignments[0].assignedTo.email,
          avatar: doc.assignments[0].assignedTo.avatar || undefined
        } : undefined,
        dueDate: doc.deadline || undefined,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        tags: doc.tags ? JSON.parse(doc.tags) : [],
        incomingDocumentId: doc.id
      })),
      ...outgoingDocs.map(doc => ({
        id: `outgoing-${doc.id}`,
        documentNumber: doc.documentNumber,
        title: doc.title,
        content: doc.content,
        summary: undefined,
        direction: DocumentDirection.OUTGOING,
        documentType: doc.documentTypeCode as DocumentTypeCode,
        status: doc.status as DocumentWorkflowStatus,
        priority: doc.priority as DocumentPriority,
        position: 1000,
        assignedToId: doc.createdById,
        assignedTo: {
          id: doc.createdBy.id,
          firstName: doc.createdBy.firstName,
          lastName: doc.createdBy.lastName,
          email: doc.createdBy.email,
          avatar: doc.createdBy.avatar || undefined
        },
        effectiveDate: doc.effectiveDate || undefined,
        expiryDate: doc.expiryDate || undefined,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        fileUrl: doc.fileUrl || undefined,
        fileName: doc.fileName || undefined,
        fileSize: doc.fileSize || undefined,
        signedFileUrl: doc.signedFileUrl || undefined,
        tags: doc.tags ? JSON.parse(doc.tags) : [],
        outgoingDocumentId: doc.id
      }))
    ];

    return NextResponse.json({
      success: true,
      data: workflowItems,
      total: workflowItems.length
    });

  } catch (error: any) {
    console.error("Error fetching document workflow:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST /api/document-workflow - Create new workflow item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      direction,
      documentType,
      status,
      priority,
      assignedToId,
      dueDate,
      effectiveDate,
      spaceId,
      departmentId,
      tags,
      incomingDocumentId,
      outgoingDocumentId
    } = body;

    // Validate required fields
    if (!title || !direction || !status || !priority) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let createdDocument;

    if (direction === DocumentDirection.INCOMING) {
      // Create incoming document
      createdDocument = await prisma.incomingDocument.create({
        data: {
          title,
          content,
          documentTypeCode: documentType,
          status,
          priority,
          deadline: dueDate ? new Date(dueDate) : undefined,
          tags: tags ? JSON.stringify(tags) : undefined,
          createdById: session.user.id,
          fileName: "",
          fileUrl: "",
          fileSize: 0,
          mimeType: "application/octet-stream"
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      // Create assignment if assignedToId provided
      if (assignedToId) {
        await prisma.incomingDocumentAssignment.create({
          data: {
            documentId: createdDocument.id,
            assignedToId,
            status,
            deadline: dueDate ? new Date(dueDate) : undefined
          }
        });
      }

    } else {
      // Create outgoing document
      createdDocument = await prisma.outgoingDocument.create({
        data: {
          title,
          content: content || "",
          documentTypeCode: documentType,
          status,
          priority,
          effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
          targetSpaces: spaceId ? JSON.stringify([spaceId]) : undefined,
          tags: tags ? JSON.stringify(tags) : undefined,
          createdById: session.user.id
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...createdDocument,
        id: `${direction.toLowerCase()}-${createdDocument.id}`,
        direction
      }
    });

  } catch (error: any) {
    console.error("Error creating document workflow:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create document" },
      { status: 500 }
    );
  }
}
