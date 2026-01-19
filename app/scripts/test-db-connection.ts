#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const DATABASE_URL = 'postgres://3c15e80f70155685640eefcd5b1c1485ec770c62a8c5def59b935227ab429ef8:sk_5s-rlEb45dHkrmN3UdYzo@db.prisma.io:5432/postgres?sslmode=require'

async function testConnection() {
  console.log('🔍 Đang kiểm tra kết nối database...\n')
  console.log('Database URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@')) // Hide password
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  })

  try {
    // Test connection by querying a simple table
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Kết nối database thành công!')
    console.log('Test query result:', result)
    
    // Try to get user count
    try {
      const userCount = await prisma.user.count()
      console.log(`\n📊 Số lượng users trong database: ${userCount}`)
    } catch (error: any) {
      console.log(`\n⚠️  Không thể đếm users: ${error.message}`)
    }
    
    // Try to get admin count
    try {
      const adminCount = await prisma.user.count({
        where: {
          role: {
            in: ['ADMIN', 'SUPER_ADMIN'],
          },
        },
      })
      console.log(`📊 Số lượng admin: ${adminCount}`)
    } catch (error: any) {
      console.log(`⚠️  Không thể đếm admin: ${error.message}`)
    }
    
  } catch (error: any) {
    console.error('❌ Lỗi kết nối database:', error.message)
    console.error('Error code:', error.code)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
  .catch((error) => {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  })
