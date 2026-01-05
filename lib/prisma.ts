import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Get DATABASE_URL - Supports both direct PostgreSQL and Prisma Accelerate URLs
function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || ''
  
  // Check if using Prisma Accelerate (connection string starts with prisma+)
  if (url.startsWith('prisma+')) {
    return url
  }
  
  return url
}

// Create base Prisma Client with optimized settings for Cloud Run
const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Only log errors in production, errors and warnings in development
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    // Optimize for serverless/Cloud Run environments
    // Reduce connection pool to avoid exhausting DB connections
    // Cloud Run instances scale up/down, so need smaller pools per instance
  })

// Extend with Prisma Accelerate if using Accelerate connection string
const databaseUrl = getDatabaseUrl()
const isAccelerate = databaseUrl.startsWith('prisma+')

// Type assertion to fix TypeScript issues with Accelerate extension
// When using Accelerate, the extended client has different types that cause TS errors
export const prisma = (isAccelerate
  ? basePrisma.$extends(withAccelerate())
  : basePrisma) as any as PrismaClient

// Configure connection pool
// Increase connection pool size and timeout for better performance
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Handle connection pool errors gracefully
// NOTE: Prisma Accelerate extended client may not expose `$on` in some runtimes/builds.
if (typeof (prisma as any).$on === 'function') {
  ;(prisma as any).$on('error', (e: any) => {
    if (e.message?.includes('connection pool') || e.message?.includes('timeout')) {
      console.error('[Prisma] Connection pool error:', e.message)
    }
  })
}

// Ensure connections are properly managed
process.on('beforeExit', async () => {
  if (typeof (prisma as any).$disconnect === 'function') {
    await (prisma as any).$disconnect()
  }
})

// Graceful shutdown
process.on('SIGINT', async () => {
  if (typeof (prisma as any).$disconnect === 'function') {
    await (prisma as any).$disconnect()
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  if (typeof (prisma as any).$disconnect === 'function') {
    await (prisma as any).$disconnect()
  }
  process.exit(0)
})

