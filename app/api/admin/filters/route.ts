import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clearFilterCache } from '@/lib/content-moderation'
import type { ContentCategory, ModerationSeverity } from '@prisma/client'

// GET /api/admin/filters - List all filters with pagination
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            )
        }

        const searchParams = req.nextUrl.searchParams
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const search = searchParams.get('search') || ''
        const category = searchParams.get('category') as ContentCategory | null
        const severity = searchParams.get('severity') as ModerationSeverity | null
        const active = searchParams.get('active')

        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}

        if (search) {
            where.OR = [
                { keyword: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (category) {
            where.category = category
        }

        if (severity) {
            where.severity = severity
        }

        if (active !== null && active !== undefined) {
            where.active = active === 'true'
        }

        // Fetch filters with pagination
        const [filters, total] = await Promise.all([
            prisma.contentFilter.findMany({
                where,
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
                orderBy: [
                    { severity: 'asc' }, // FORBIDDEN first
                    { createdAt: 'desc' },
                ],
                skip,
                take: limit,
            }),
            prisma.contentFilter.count({ where }),
        ])

        return NextResponse.json({
            filters,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching filters:', error)
        return NextResponse.json(
            { error: 'Failed to fetch filters' },
            { status: 500 }
        )
    }
}

// POST /api/admin/filters - Create new filter
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            )
        }

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

        // Validation
        if (!keyword || !category || !severity) {
            return NextResponse.json(
                { error: 'Missing required fields: keyword, category, severity' },
                { status: 400 }
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

        // Create filter
        const filter = await prisma.contentFilter.create({
            data: {
                keyword: keyword.trim(),
                category,
                severity,
                description: description?.trim() || null,
                replacement: replacement?.trim() || null,
                isRegex: isRegex ?? false,
                caseSensitive: caseSensitive ?? false,
                wholeWord: wholeWord ?? true,
                allowedContexts: allowedContexts || null,
                active: active ?? true,
                createdById: session.user.id,
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

        // Clear cache to apply new filter immediately
        clearFilterCache()

        return NextResponse.json(filter, { status: 201 })
    } catch (error) {
        console.error('Error creating filter:', error)
        return NextResponse.json(
            { error: 'Failed to create filter' },
            { status: 500 }
        )
    }
}
