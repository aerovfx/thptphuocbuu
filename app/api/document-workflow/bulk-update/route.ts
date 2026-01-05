/**
 * Document Workflow Bulk Update API
 * For Kanban drag-and-drop operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { DocumentDirection, DocumentWorkflowStatus } from "@/types/document-workflow";

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

// POST /api/document-workflow/bulk-update
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { documents } = body;

    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { error: "Invalid request: documents array required" },
        { status: 400 }
      );
    }

    // Validate all document IDs
    const parsedDocuments = documents.map(doc => {
      const parsed = parseDocumentId(doc.id);
      if (!parsed) {
        throw new Error(`Invalid document ID: ${doc.id}`);
      }
      return {
        ...doc,
        ...parsed
      };
    });

    // Group by direction and update
    const incomingDocs = parsedDocuments.filter(d => d.direction === DocumentDirection.INCOMING);
    const outgoingDocs = parsedDocuments.filter(d => d.direction === DocumentDirection.OUTGOING);

    const updatePromises = [];

    // Update incoming documents
    for (const doc of incomingDocs) {
      updatePromises.push(
        prisma.incomingDocument.update({
          where: { id: doc.docId },
          data: {
            status: doc.status,
            // position field doesn't exist in schema, but we can add it later
            // For now, we just update the status
          }
        })
      );
    }

    // Update outgoing documents
    for (const doc of outgoingDocs) {
      updatePromises.push(
        prisma.outgoingDocument.update({
          where: { id: doc.docId },
          data: {
            status: doc.status
          }
        })
      );
    }

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      data: {
        updated: documents.length
      }
    });

  } catch (error: any) {
    console.error("Error bulk updating documents:", error);
    return NextResponse.json(
      { error: error.message || "Failed to bulk update documents" },
      { status: 500 }
    );
  }
}
