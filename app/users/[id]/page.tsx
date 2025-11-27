import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import UserProfile from '@/components/Profile/UserProfile'

async function getUserProfile(userId: string, currentUserId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        role: true,
        phone: true,
        dateOfBirth: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            friendships: true,
            friendships2: true,
          },
        },
      },
  })

  if (!user) {
    return null
  }

  // Check if current user is following this user
  let isFollowing = false
  if (currentUserId && currentUserId !== userId) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        user1Id: currentUserId,
        user2Id: userId,
      },
    })
    isFollowing = !!friendship
  }

  // Get user's posts
  const userPosts = await prisma.post.findMany({
    where: { authorId: userId },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          bookmarks: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Get user's remixed posts
  let remixedPosts: any[] = []
  try {
    // Check if repost model exists
    if (prisma.repost) {
      remixedPosts = await prisma.repost.findMany({
        where: { userId },
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                  bookmarks: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    }
  } catch (error) {
    // If repost model doesn't exist or there's an error, use empty array
    console.error('Error fetching remixed posts:', error)
    remixedPosts = []
  }

  // Combine posts and remixed posts, marking remixed ones
  const allPosts = [
    ...userPosts.map((post) => ({ ...post, isRemix: false })),
    ...remixedPosts.map((repost) => ({ ...repost.post, isRemix: true, remixedAt: repost.createdAt })),
  ].sort((a, b) => {
    const dateA = a.isRemix ? new Date(a.remixedAt).getTime() : new Date(a.createdAt).getTime()
    const dateB = b.isRemix ? new Date(b.remixedAt).getTime() : new Date(b.createdAt).getTime()
    return dateB - dateA
  })

  // Calculate following/followers count
  const followingCount = await prisma.friendship.count({
    where: { user1Id: userId },
  })
  const followersCount = await prisma.friendship.count({
    where: { user2Id: userId },
  })

  // Get user's brand badge (with error handling)
  let brandBadge = null
  let affiliatedAccounts: any[] = []
  
  try {
    // Check if BrandBadge model exists in database
    brandBadge = await prisma.brandBadge.findFirst({
      where: {
        userId,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            verificationStatus: true,
          },
        },
      },
    })

    // Get affiliated accounts (other members of the same brand)
    if (brandBadge) {
      try {
        const brandMembers = await prisma.brandMember.findMany({
          where: {
            brandId: brandBadge.brandId,
            userId: { not: userId }, // Exclude current user
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
          take: 10, // Limit to 10 affiliated accounts
        })
        affiliatedAccounts = brandMembers.map((m) => m.user)
      } catch (error: any) {
        // If brandMember table doesn't exist, use empty array
        // P2021 = Table does not exist
        // P2001 = Record not found
        if (error?.code !== 'P2021' && error?.code !== 'P2001') {
          console.error('Error fetching brand members:', error)
        }
        affiliatedAccounts = []
      }
    }
  } catch (error: any) {
    // If BrandBadge table doesn't exist (P2021) or other Prisma errors, use null
    // P2021 = Table does not exist
    // P2001 = Record not found
    if (error?.code !== 'P2021' && error?.code !== 'P2001') {
      console.error('Error fetching brand badge:', error)
    }
    brandBadge = null
    affiliatedAccounts = []
  }

  return {
    ...user,
    isFollowing,
    posts: allPosts,
    remixedPosts: remixedPosts.map((r) => r.post),
    followingCount,
    followersCount,
    brandBadge: brandBadge && brandBadge.brand
      ? {
          badgeType: brandBadge.badgeType,
          badgeIconUrl: brandBadge.badgeIconUrl,
          brand: brandBadge.brand,
        }
      : null,
    affiliatedAccounts,
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  const userProfile = await getUserProfile(id, session?.user.id)

  if (!userProfile) {
    redirect('/dashboard')
  }

  return <UserProfile user={userProfile} currentUser={session} />
}

