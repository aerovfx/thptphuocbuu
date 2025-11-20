/**
 * Caching Strategy cho News Feed
 * 
 * Multi-level cache:
 * - L1: In-memory cache (Node.js Map) - TTL: 5 phút
 * - L2: Redis (nếu available) - TTL: 15 phút
 * - L3: Database query cache - TTL: 1 giờ
 */

interface CacheOptions {
  ttl?: number // Time to live in seconds
  namespace?: string
}

class InMemoryCache {
  private cache: Map<string, { value: any; expires: number }> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key)
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (entry.expires < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    const expires = Date.now() + ttl * 1000
    this.cache.set(key, { value, expires })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }
}

// Redis client wrapper (optional, falls back to in-memory if not available)
class RedisCache {
  private client: any = null
  private isAvailable: boolean = false

  constructor() {
    // Try to initialize Redis if available
    this.initRedis()
  }

  private async initRedis() {
    // Only initialize Redis if REDIS_URL is set and ioredis is available
    if (!process.env.REDIS_URL) {
      return
    }

    try {
      // Dynamic require to avoid build error if ioredis is not installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Redis = require('ioredis')
      this.client = new Redis(process.env.REDIS_URL, {
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        maxRetriesPerRequest: 3,
      })

      this.client.on('error', (err: Error) => {
        console.error('Redis connection error:', err)
        this.isAvailable = false
      })

      this.client.on('connect', () => {
        this.isAvailable = true
        console.log('Redis connected')
      })

      // Test connection
      await this.client.ping()
      this.isAvailable = true
    } catch (error: any) {
      // Handle case where ioredis is not installed
      if (error.code === 'MODULE_NOT_FOUND') {
        console.warn('ioredis not installed, Redis cache disabled')
      } else {
        console.warn('Redis not available, using in-memory cache:', error)
      }
      this.isAvailable = false
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable || !this.client) return null

    try {
      const value = await this.client.get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    if (!this.isAvailable || !this.client) return

    try {
      await this.client.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isAvailable || !this.client) return

    try {
      await this.client.del(key)
    } catch (error) {
      console.error('Redis delete error:', error)
    }
  }

  async clear(pattern?: string): Promise<void> {
    if (!this.isAvailable || !this.client) return

    try {
      if (pattern) {
        const keys = await this.client.keys(pattern)
        if (keys.length > 0) {
          await this.client.del(...keys)
        }
      }
    } catch (error) {
      console.error('Redis clear error:', error)
    }
  }
}

// Multi-level cache manager
class CacheManager {
  private l1Cache: InMemoryCache
  private l2Cache: RedisCache

  constructor() {
    this.l1Cache = new InMemoryCache()
    this.l2Cache = new RedisCache()
  }

  private getKey(namespace: string, key: string): string {
    return `feed:${namespace}:${key}`
  }

  /**
   * Get value from cache (checks L1 first, then L2)
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const namespace = options?.namespace || 'default'
    const fullKey = this.getKey(namespace, key)

    // Check L1 cache first
    const l1Value = await this.l1Cache.get<T>(fullKey)
    if (l1Value !== null) {
      return l1Value
    }

    // Check L2 cache (Redis)
    const l2Value = await this.l2Cache.get<T>(fullKey)
    if (l2Value !== null) {
      // Populate L1 cache
      await this.l1Cache.set(fullKey, l2Value, 300) // 5 minutes
      return l2Value
    }

    return null
  }

  /**
   * Set value in cache (sets both L1 and L2)
   */
  async set(
    key: string,
    value: any,
    options?: CacheOptions
  ): Promise<void> {
    const namespace = options?.namespace || 'default'
    const fullKey = this.getKey(namespace, key)
    const ttl = options?.ttl || 300 // Default 5 minutes

    // Set in L1 cache (5 minutes)
    await this.l1Cache.set(fullKey, value, Math.min(ttl, 300))

    // Set in L2 cache (Redis) with longer TTL
    await this.l2Cache.set(fullKey, value, Math.max(ttl, 900)) // At least 15 minutes
  }

  /**
   * Delete value from cache (both L1 and L2)
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    const namespace = options?.namespace || 'default'
    const fullKey = this.getKey(namespace, key)

    await Promise.all([
      this.l1Cache.delete(fullKey),
      this.l2Cache.delete(fullKey),
    ])
  }

  /**
   * Invalidate cache by pattern (useful for user-specific caches)
   */
  async invalidate(pattern: string, options?: CacheOptions): Promise<void> {
    const namespace = options?.namespace || 'default'
    const fullPattern = `feed:${namespace}:${pattern}`

    // Clear L1 cache entries matching pattern
    // Note: In-memory cache doesn't support pattern matching efficiently
    // In production, you might want to maintain a key index

    // Clear L2 cache (Redis) by pattern
    await this.l2Cache.clear(fullPattern)
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    await Promise.all([this.l1Cache.clear(), this.l2Cache.clear('feed:*')])
  }
}

// Singleton instance
export const cacheManager = new CacheManager()

/**
 * Cache decorator for functions
 */
export function cached(
  keyGenerator: (...args: any[]) => string,
  options?: CacheOptions
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args)
      const cachedValue = await cacheManager.get(cacheKey, options)

      if (cachedValue !== null) {
        return cachedValue
      }

      const result = await method.apply(this, args)
      await cacheManager.set(cacheKey, result, options)

      return result
    }

    return descriptor
  }
}

/**
 * Helper functions for common cache operations
 */
export const feedCache = {
  /**
   * Get cached feed for user
   */
  async getFeed(userId: string | null, tab: string, query?: string) {
    const key = `feed:${userId || 'guest'}:${tab}:${query || 'none'}`
    return cacheManager.get(key, { namespace: 'feeds', ttl: 300 })
  },

  /**
   * Set cached feed for user
   */
  async setFeed(
    userId: string | null,
    tab: string,
    query: string | undefined,
    value: any
  ) {
    const key = `feed:${userId || 'guest'}:${tab}:${query || 'none'}`
    return cacheManager.set(key, value, { namespace: 'feeds', ttl: 300 })
  },

  /**
   * Invalidate user's feed cache
   */
  async invalidateUserFeed(userId: string) {
    return cacheManager.invalidate(`feed:${userId}:*`, {
      namespace: 'feeds',
    })
  },

  /**
   * Invalidate all feed caches (when new post is created)
   */
  async invalidateAllFeeds() {
    return cacheManager.invalidate('*', { namespace: 'feeds' })
  },
}

