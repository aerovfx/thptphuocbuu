import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get list of users who have uploaded documents, prioritized by role
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const isAdmin =
      session.user.role === 'ADMIN' ||
      session.user.role === 'SUPER_ADMIN'

    // Get all users who have created incoming or outgoing documents
    const [incomingCreators, outgoingCreators] = await Promise.all([
      prisma.incomingDocument.findMany({
        select: {
          createdById: true,
        },
        distinct: ['createdById'],
      }),
      prisma.outgoingDocument.findMany({
        select: {
          createdById: true,
        },
        distinct: ['createdById'],
      }),
    ])

    // Combine and get unique user IDs
    const creatorIds = new Set([
      ...incomingCreators.map((doc) => doc.createdById),
      ...outgoingCreators.map((doc) => doc.createdById),
    ])

    if (creatorIds.size === 0) {
      return NextResponse.json({ users: [] })
    }

    // Get users with priority roles first
    const priorityRoles = ['BGH', 'TAI_CHINH', 'ADMIN', 'SUPER_ADMIN']
    
    const users = await prisma.user.findMany({
      where: {
        id: { in: Array.from(creatorIds) },
        ...(isAdmin ? {} : { status: 'ACTIVE' }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatar: true,
        ...(isAdmin ? { status: true } : {}),
      },
      orderBy: [
        // Priority: BGH first, then TAI_CHINH, then others
        {
          role: 'asc', // This will sort alphabetically, but we'll sort manually
        },
      ],
    })

    // Sort users: priority roles first, then others
    const sortedUsers = users.sort((a, b) => {
      const aPriority = priorityRoles.indexOf(a.role)
      const bPriority = priorityRoles.indexOf(b.role)
      
      // If both are priority roles, maintain order
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority
      }
      // If only a is priority, a comes first
      if (aPriority !== -1) return -1
      // If only b is priority, b comes first
      if (bPriority !== -1) return 1
      // Neither is priority, sort by name
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    })

    return NextResponse.json({ users: sortedUsers })
  } catch (error: any) {
    console.error('Error fetching document uploaders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

