#!/usr/bin/env tsx
/**
 * Environment & Configuration Check Script
 * 
 * Kiểm tra toàn bộ môi trường và cấu hình trước khi deploy
 * 
 * Usage: npx tsx scripts/check-environment.ts
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

interface CheckResult {
  name: string
  status: '✅' | '❌' | '⚠️'
  message: string
  details?: string
}

const results: CheckResult[] = []

// Helper function to add check result
function addResult(name: string, status: '✅' | '❌' | '⚠️', message: string, details?: string) {
  results.push({ name, status, message, details })
}

// 1. Check Node.js version
function checkNodeVersion() {
  try {
    const version = process.version
    const major = parseInt(version.slice(1).split('.')[0])
    if (major >= 18) {
      addResult('Node.js Version', '✅', `Node.js ${version} (>= 18 required)`)
    } else {
      addResult('Node.js Version', '❌', `Node.js ${version} (>= 18 required)`)
    }
  } catch (error) {
    addResult('Node.js Version', '❌', 'Cannot determine Node.js version')
  }
}

// 2. Check Next.js version
function checkNextVersion() {
  try {
    const packageJson = require('../package.json')
    const nextVersion = packageJson.dependencies.next
    addResult('Next.js Version', '✅', `Next.js ${nextVersion}`)
  } catch (error) {
    addResult('Next.js Version', '❌', 'Cannot determine Next.js version')
  }
}

// 3. Check Prisma version
function checkPrismaVersion() {
  try {
    const packageJson = require('../package.json')
    const prismaVersion = packageJson.dependencies['@prisma/client']
    addResult('Prisma Version', '✅', `Prisma ${prismaVersion}`)
  } catch (error) {
    addResult('Prisma Version', '❌', 'Cannot determine Prisma version')
  }
}

// 4. Check environment variables
function checkEnvironmentVariables() {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ]

  const optionalVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'OPENAI_API_KEY',
    'REDIS_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
  ]

  let missingRequired = 0
  let missingOptional = 0

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingRequired++
      addResult(`Env: ${varName}`, '❌', 'Missing (required)')
    } else {
      // Mask sensitive values
      const value = varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('KEY')
        ? '***' + process.env[varName]!.slice(-4)
        : process.env[varName]
      addResult(`Env: ${varName}`, '✅', `Set: ${value}`)
    }
  }

  for (const varName of optionalVars) {
    if (!process.env[varName]) {
      missingOptional++
      addResult(`Env: ${varName}`, '⚠️', 'Not set (optional)')
    } else {
      const value = varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('KEY')
        ? '***' + process.env[varName]!.slice(-4)
        : process.env[varName]
      addResult(`Env: ${varName}`, '✅', `Set: ${value}`)
    }
  }

  if (missingRequired > 0) {
    addResult('Environment Variables', '❌', `${missingRequired} required variables missing`)
  } else if (missingOptional > 0) {
    addResult('Environment Variables', '⚠️', `All required set, ${missingOptional} optional missing`)
  } else {
    addResult('Environment Variables', '✅', 'All variables set')
  }
}

// 5. Check database connection
async function checkDatabaseConnection() {
  try {
    await prisma.$connect()
    addResult('Database Connection', '✅', 'Connected successfully')
    
    // Check if database is accessible
    const userCount = await prisma.user.count()
    addResult('Database Access', '✅', `Database accessible (${userCount} users found)`)
  } catch (error: any) {
    addResult('Database Connection', '❌', `Connection failed: ${error.message}`)
  }
}

// 6. Check database migrations
async function checkDatabaseMigrations() {
  try {
    // Check if Prisma Client is generated
    try {
      await prisma.$queryRaw`SELECT 1`
      addResult('Prisma Client', '✅', 'Generated and working')
    } catch (error: any) {
      addResult('Prisma Client', '❌', 'Not generated or invalid. Run: npm run db:generate')
    }

    // Check if schema is synced
    try {
      const tables = await prisma.$queryRaw<Array<{ name: string }>>`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `
      if (tables.length > 0) {
        addResult('Database Schema', '✅', `${tables.length} tables found`)
      } else {
        addResult('Database Schema', '⚠️', 'No tables found. Run: npm run db:push')
      }
    } catch (error: any) {
      addResult('Database Schema', '❌', `Schema check failed: ${error.message}`)
    }
  } catch (error: any) {
    addResult('Database Migrations', '❌', `Check failed: ${error.message}`)
  }
}

// 7. Check Redis (if configured)
async function checkRedis() {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    addResult('Redis Cache', '⚠️', 'Not configured (optional)')
    return
  }

  try {
    // Try to import and connect to Redis
    const Redis = require('ioredis')
    const redis = new Redis(redisUrl)
    
    await redis.ping()
    addResult('Redis Cache', '✅', 'Connected successfully')
    
    // Check if we can set/get
    await redis.set('health-check', 'ok', 'EX', 10)
    const value = await redis.get('health-check')
    if (value === 'ok') {
      addResult('Redis Operations', '✅', 'Read/Write working')
    } else {
      addResult('Redis Operations', '❌', 'Read/Write failed')
    }
    
    redis.disconnect()
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      addResult('Redis Cache', '⚠️', 'Redis URL set but ioredis not installed')
    } else {
      addResult('Redis Cache', '❌', `Connection failed: ${error.message}`)
    }
  }
}

// 8. Check email/SMS configuration
function checkEmailSMSConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development'
  
  if (nodeEnv === 'production') {
    // In production, check if email/SMS is properly configured
    const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    if (hasSMTP) {
      addResult('Email Configuration', '✅', 'SMTP configured for production')
    } else {
      addResult('Email Configuration', '❌', 'SMTP not configured (required in production)')
    }
  } else {
    // In development, email should be disabled or use sandbox
    addResult('Email Configuration', '✅', 'Development mode - email sending disabled (logs to console)')
  }

  // Check if there's any SMS service configured
  const hasSMS = process.env.TWILIO_ACCOUNT_SID || process.env.SMS_API_KEY
  if (hasSMS && nodeEnv === 'production') {
    addResult('SMS Configuration', '✅', 'SMS service configured')
  } else if (hasSMS && nodeEnv === 'development') {
    addResult('SMS Configuration', '⚠️', 'SMS configured but in development mode (should use sandbox)')
  } else {
    addResult('SMS Configuration', '⚠️', 'SMS not configured (optional)')
  }
}

// 9. Check API endpoints environment
function checkAPIEndpoints() {
  const nextAuthUrl = process.env.NEXTAUTH_URL
  const nodeEnv = process.env.NODE_ENV || 'development'

  if (nodeEnv === 'production') {
    if (nextAuthUrl && !nextAuthUrl.includes('localhost')) {
      addResult('API Endpoints', '✅', `Production URL: ${nextAuthUrl}`)
    } else {
      addResult('API Endpoints', '❌', 'Production mode but NEXTAUTH_URL points to localhost')
    }
  } else {
    if (nextAuthUrl && nextAuthUrl.includes('localhost')) {
      addResult('API Endpoints', '✅', `Development URL: ${nextAuthUrl}`)
    } else {
      addResult('API Endpoints', '⚠️', `Development mode but NEXTAUTH_URL: ${nextAuthUrl}`)
    }
  }
}

// 10. Check build status
function checkBuildStatus() {
  try {
    // Check if .next directory exists
    const fs = require('fs')
    const path = require('path')
    const nextDir = path.join(process.cwd(), '.next')
    
    if (fs.existsSync(nextDir)) {
      addResult('Build Status', '✅', 'Build directory exists')
    } else {
      addResult('Build Status', '⚠️', 'No build found. Run: npm run build')
    }
  } catch (error: any) {
    addResult('Build Status', '❌', `Check failed: ${error.message}`)
  }
}

// 11. Check seed data
async function checkSeedData() {
  try {
    const userCount = await prisma.user.count()
    const classCount = await prisma.class.count()
    const postCount = await prisma.post.count()

    if (userCount > 0) {
      addResult('Seed Data: Users', '✅', `${userCount} users found`)
    } else {
      addResult('Seed Data: Users', '⚠️', 'No users found. Run: npm run db:seed')
    }

    if (classCount > 0) {
      addResult('Seed Data: Classes', '✅', `${classCount} classes found`)
    } else {
      addResult('Seed Data: Classes', '⚠️', 'No classes found')
    }

    if (postCount > 0) {
      addResult('Seed Data: Posts', '✅', `${postCount} posts found`)
    } else {
      addResult('Seed Data: Posts', '⚠️', 'No posts found')
    }
  } catch (error: any) {
    addResult('Seed Data', '❌', `Check failed: ${error.message}`)
  }
}

// Main function
async function main() {
  console.log('🔍 Kiểm tra môi trường & cấu hình...\n')
  console.log('='.repeat(80))
  console.log('')

  // Run all checks
  checkNodeVersion()
  checkNextVersion()
  checkPrismaVersion()
  checkEnvironmentVariables()
  await checkDatabaseConnection()
  await checkDatabaseMigrations()
  await checkRedis()
  checkEmailSMSConfig()
  checkAPIEndpoints()
  checkBuildStatus()
  await checkSeedData()

  // Print results
  console.log('📊 KẾT QUẢ KIỂM TRA:\n')
  console.log('='.repeat(80))
  console.log('')

  for (const result of results) {
    console.log(`${result.status} ${result.name}`)
    console.log(`   ${result.message}`)
    if (result.details) {
      console.log(`   ${result.details}`)
    }
    console.log('')
  }

  // Summary
  const passed = results.filter(r => r.status === '✅').length
  const warnings = results.filter(r => r.status === '⚠️').length
  const failed = results.filter(r => r.status === '❌').length

  console.log('='.repeat(80))
  console.log('📈 TÓM TẮT:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ⚠️  Warnings: ${warnings}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log('='.repeat(80))
  console.log('')

  if (failed > 0) {
    console.log('❌ Có lỗi cần sửa trước khi deploy!')
    process.exit(1)
  } else if (warnings > 0) {
    console.log('⚠️  Có cảnh báo, nhưng có thể tiếp tục.')
    process.exit(0)
  } else {
    console.log('✅ Tất cả kiểm tra đều pass!')
    process.exit(0)
  }
}

main()
  .catch((error) => {
    console.error('❌ Error running checks:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

