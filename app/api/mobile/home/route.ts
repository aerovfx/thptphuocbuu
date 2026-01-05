import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/jwt-auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        // 1. Authentication
        const jwtUser = await authenticateRequest(request)
        const session = !jwtUser ? await getServerSession(authOptions) : null

        if (!jwtUser && !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = jwtUser?.id || session?.user?.id

        // 2. Fetch User Profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // 3. Fetch Space Tasks (Assigned to user, not done)
        // Assuming columns: 'todo', 'in_progress', 'review' are "active". 'done' is completed.
        const spaceTasks = await prisma.spaceTask.findMany({
            where: {
                assignedToId: userId,
                column: {
                    notIn: ['done', 'completed', 'archive'], // Exclude completed tasks
                },
            },
            include: {
                space: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                }
            },
            orderBy: {
                dueDate: 'asc', // Soonest due first
            },
            take: 10, // Limit to 10 tasks
        })

        // 4. Fetch Document Assignments (Assigned to user, pending)
        const documentAssignments = await prisma.incomingDocumentAssignment.findMany({
            where: {
                assignedToId: userId,
                status: {
                    in: ['PENDING', 'PROCESSING'],
                },
            },
            include: {
                document: {
                    select: {
                        id: true,
                        title: true,
                        documentNumber: true,
                        createdById: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 5, // Limit to 5 documents
        })

        // 5. Combine and Format Tasks
        const tasks = [
            ...spaceTasks.map((task) => ({
                id: task.id,
                type: 'SPACE_TASK',
                title: task.title,
                description: task.description,
                source: task.space.name,
                sourceType: task.space.type,
                status: task.column,
                dueDate: task.dueDate,
                createdAt: task.createdAt,
                priority: task.priority,
                meta: {
                    spaceId: task.space.id,
                    creatorName: `${task.createdBy.firstName} ${task.createdBy.lastName}`
                }
            })),
            ...documentAssignments.map((assign) => ({
                id: assign.id,
                type: 'DOCUMENT_TASK',
                title: assign.document.title,
                description: assign.notes,
                source: 'Văn bản đến', // "Incoming Document"
                sourceType: 'DOCUMENT',
                status: assign.status,
                dueDate: assign.deadline,
                createdAt: assign.createdAt,
                priority: 'NORMAL', // Document assignment doesn't strictly have priority mapped like task, using default
                meta: {
                    documentId: assign.document.id,
                    documentNumber: assign.document.documentNumber
                }
            })),
        ].sort((a, b) => {
            // Sort by Due Date (nulls last), then Created At (newest first)
            if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // 6. Return Data
        return NextResponse.json({
            user: {
                ...user,
                fullName: `${user.lastName} ${user.firstName}`,
            },
            weather: {
                // Mock weather data - ideally verify implementation with external API later
                location: 'Bà Rịa - Vũng Tàu',
                temperature: 28,
                condition: 'Nắng',
                humidity: 75,
                windSpeed: 15,
            },
            tasks,
        })

    } catch (error) {
        console.error('[Mobile Home API] Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
