import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ contacts: [] })
    }

    const userId = session.user.id
    const isAdmin =
      session.user.role === 'ADMIN' ||
      session.user.role === 'SUPER_ADMIN'

    // Get all users except the current logged-in user
    const contacts = await prisma.user.findMany({
      where: {
        id: { not: userId }, // Exclude current user
        ...(isAdmin ? {} : { status: 'ACTIVE' }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Format contacts
    const formattedContacts = contacts.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    }))

    return NextResponse.json({ contacts: formattedContacts })
  } catch (error) {
    console.error('Error fetching recent contacts:', error)
    return NextResponse.json({ contacts: [] }, { status: 500 })
  }
}

