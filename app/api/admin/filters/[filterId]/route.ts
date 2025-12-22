import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clearFilterCache } from '@/lib/content-moderation'

// PUT /api/admin/filters/[filterId] - Update filter
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ filterId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            )
        }

        const { filterId } = await params
        const body = await req.json()
        const {
            keyword,
            category,
            severity,
            description,
            replacement,
            isRegex,
            caseSensitive,
            wholeWord,
            allowedContexts,
            active,
        } = body

        // Check if filter exists
        const existingFilter = await prisma.contentFilter.findUnique({
            where: { id: filterId },
        })

        if (!existingFilter) {
            return NextResponse.json(
                { error: 'Filter not found' },
                { status: 404 }
            )
        }

        // Validate allowed contexts if provided
        if (allowedContexts) {
            try {
                JSON.parse(allowedContexts)
            } catch (e) {
                return NextResponse.json(
                    { error: 'Invalid allowedContexts format - must be valid JSON array' },
                    { status: 400 }
                )
            }
        }

        // Update filter
        const filter = await prisma.contentFilter.update({
            where: { id: filterId },
            data: {
                ...(keyword !== undefined && { keyword: keyword.trim() }),
                ...(category !== undefined && { category }),
                ...(severity !== undefined && { severity }),
                ...(description !== undefined && { description: description?.trim() || null }),
                ...(replacement !== undefined && { replacement: replacement?.trim() || null }),
                ...(isRegex !== undefined && { isRegex }),
                ...(caseSensitive !== undefined && { caseSensitive }),
                ...(wholeWord !== undefined && { wholeWord }),
                ...(allowedContexts !== undefined && { allowedContexts }),
                ...(active !== undefined && { active }),
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        })

        // Clear cache to apply changes immediately
        clearFilterCache()

        return NextResponse.json(filter)
    } catch (error) {
        console.error('Error updating filter:', error)
        return NextResponse.json(
            { error: 'Failed to update filter' },
            { status: 500 }
        )
    }
}

// DELETE /api/admin/filters/[filterId] - Delete filter
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ filterId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            )
        }

        const { filterId } = await params
        const searchParams = req.nextUrl.searchParams
        const hardDelete = searchParams.get('hard') === 'true'

        // Check if filter exists
        const existingFilter = await prisma.contentFilter.findUnique({
            where: { id: filterId },
        })

        if (!existingFilter) {
            return NextResponse.json(
                { error: 'Filter not found' },
                { status: 404 }
            )
        }

        if (hardDelete) {
            // Permanently delete filter
            await prisma.contentFilter.delete({
                where: { id: filterId },
            })
        } else {
            // Soft delete - just deactivate
            await prisma.contentFilter.update({
                where: { id: filterId },
                data: { active: false },
            })
        }

        // Clear cache to apply changes immediately
        clearFilterCache()

        return NextResponse.json({
            success: true,
            message: hardDelete ? 'Filter permanently deleted' : 'Filter deactivated'
        })
    } catch (error) {
        console.error('Error deleting filter:', error)
        return NextResponse.json(
            { error: 'Failed to delete filter' },
            { status: 500 }
        )
    }
}
