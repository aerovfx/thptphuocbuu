export interface SocialPost {
  id: string
  content: string
  createdAt: Date
  imageUrl?: string | null
  images?: string[]
  videoUrl?: string | null
  linkUrl?: string | null
  type?: string
  locationName?: string | null
  latitude?: number | null
  longitude?: number | null
  scheduledAt?: Date | null
  isRemix?: boolean
  remixedAt?: Date | string
  author: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
    brandBadge?: {
      badgeType: 'GOLD' | 'SILVER' | 'BLUE'
      badgeIconUrl: string | null
      brand: {
        id: string
        name: string
        logoUrl: string | null
        verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
      }
    } | null
  }
  _count?: {
    likes: number
    comments: number
    reposts?: number
  }
}


