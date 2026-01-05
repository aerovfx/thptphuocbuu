/**
 * Document Workflow Detail API Routes
 * Individual document operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { DocumentDirection } from "@/types/document-workflow";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to parse document ID
function parseDocumentId(id: string): { direction: DocumentDirection; docId: string } | null {
  const parts = id.split("-");
  if (parts.length < 2) return null;

  const direction = parts[0].toUpperCase() as DocumentDirection;
  const docId = parts.slice(1).join("-");

  if (direction !== DocumentDirection.INCOMING && direction !== DocumentDirection.OUTGOING) {
    return null;
  }

  return { direction, docId };
}

// GET /api/document-workflow/[id] - Get single document
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const parsed = parseDocumentId(id);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
    }

    const { direction, docId } = parsed;

    let document;

    if (direction === DocumentDirection.INCOMING) {
      document = await prisma.incomingDocument.findUnique({
        where: { id: docId },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true
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
        }
      });
    } else {
      document = await prisma.outgoingDocument.findUnique({
        where: { id: docId },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true
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
          },
          signatures: {
            include: {
              signedByUser: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });
    }

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...document,
        id,
        direction
      }
    });

  } catch (error: any) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch document" },
      { status: 500 }
    );
  }
}

// PATCH /api/document-workflow/[id] - Update document
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const parsed = parseDocumentId(id);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
    }

    const { direction, docId } = parsed;
    const body = await request.json();

    const {
      title,
      content,
      summary,
      status,
      priority,
      assignedToId,
      dueDate,
      effectiveDate,
      expiryDate,
      tags
    } = body;

    let updatedDocument;

    if (direction === DocumentDirection.INCOMING) {
      updatedDocument = await prisma.incomingDocument.update({
        where: { id: docId },
        data: {
          ...(title && { title }),
          ...(content && { content }),
          ...(summary && { summary }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(dueDate && { deadline: new Date(dueDate) }),
          ...(tags && { tags: JSON.stringify(tags) })
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

      // Update assignment if needed
      if (assignedToId) {
        const existingAssignment = await prisma.incomingDocumentAssignment.findFirst({
          where: { documentId: docId }
        });

        if (existingAssignment) {
          await prisma.incomingDocumentAssignment.update({
            where: { id: existingAssignment.id },
            data: {
              assignedToId,
              ...(status && { status }),
              ...(dueDate && { deadline: new Date(dueDate) })
            }
          });
        } else {
          await prisma.incomingDocumentAssignment.create({
            data: {
              documentId: docId,
              assignedToId,
              status: status || "PENDING",
              deadline: dueDate ? new Date(dueDate) : undefined
            }
          });
        }
      }

    } else {
      updatedDocument = await prisma.outgoingDocument.update({
        where: { id: docId },
        data: {
          ...(title && { title }),
          ...(content && { content }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(effectiveDate && { effectiveDate: new Date(effectiveDate) }),
          ...(expiryDate && { expiryDate: new Date(expiryDate) }),
          ...(tags && { tags: JSON.stringify(tags) })
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
        ...updatedDocument,
        id,
        direction
      }
    });

  } catch (error: any) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update document" },
      { status: 500 }
    );
  }
}

// DELETE /api/document-workflow/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const parsed = parseDocumentId(id);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
    }

    const { direction, docId } = parsed;

    if (direction === DocumentDirection.INCOMING) {
      await prisma.incomingDocument.delete({
        where: { id: docId }
      });
    } else {
      await prisma.outgoingDocument.delete({
        where: { id: docId }
      });
    }

    return NextResponse.json({
      success: true,
      data: { id }
    });

  } catch (error: any) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
