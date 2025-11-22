/**
 * Simple in-memory cache for API responses
 * In production, consider using Redis or similar
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { data, expiresAt })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton instance
export const cache = new SimpleCache()

// Feed cache instance (alias for backward compatibility)
export const feedCache = {
  getFeed: async (userId: string | null, tab: string, query?: string) => {
    const key = `feed:${userId || 'anonymous'}:${tab}:${query || ''}`
    return cache.get(key)
  },
  setFeed: async (userId: string | null, tab: string, query: string | undefined, data: any, ttl: number = 300) => {
    const key = `feed:${userId || 'anonymous'}:${tab}:${query || ''}`
    cache.set(key, data, ttl)
  },
  clearFeed: (userId: string | null) => {
    // Clear all feed cache entries for this user
    // Note: This is a simple implementation, in production you might want more sophisticated cache invalidation
    cache.clear()
  },
  invalidateAllFeeds: async () => {
    // Clear all feed caches
    cache.clear()
  },
  invalidateUserFeed: async (userId: string) => {
    // Clear all feed caches for a specific user
    // Simple implementation: clear all (in production, you'd want to selectively clear)
    cache.clear()
  },
}

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  posts: (page: number = 1, limit: number = 50) => `posts:${page}:${limit}`,
  news: (page: number = 1, limit: number = 20) => `news:${page}:${limit}`,
  user: (userId: string) => `user:${userId}`,
  stats: (userId: string) => `stats:${userId}`,
}
