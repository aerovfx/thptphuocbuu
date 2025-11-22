import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get user with ownedBrand, but handle case where Brand table might not exist
    let user
    try {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isPremium: true,
          ownedBrand: {
            select: {
              id: true,
              name: true,
              verificationStatus: true,
            },
          },
        },
      })
    } catch (dbError: any) {
      // If ownedBrand relation doesn't exist, try without it
      if (dbError?.code === 'P2009' || dbError?.code === 'P2011' || dbError?.message?.includes('ownedBrand')) {
        user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isPremium: true,
          },
        })
        // Add null brand info
        if (user) {
          return NextResponse.json({
            isPremium: user.isPremium || false,
            hasBrand: false,
            brand: null,
          })
        }
      }
      throw dbError
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      isPremium: user.isPremium || false,
      hasBrand: !!(user as any).ownedBrand,
      brand: (user as any).ownedBrand || null,
    })
  } catch (error: any) {
    console.error('Error getting premium status:', error)
    // Return a safe default response instead of error
    return NextResponse.json({
      isPremium: false,
      hasBrand: false,
      brand: null,
    })
  }
}

