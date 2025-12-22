import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testModuleQuery() {
  try {
    console.log('Đang test query modules...')
    
    const modules = await prisma.module.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    })

    console.log(`Tìm thấy ${modules.length} modules:`)
    modules.forEach((module) => {
      console.log(`- ${module.key}: ${module.name} (createdAt: ${module.createdAt})`)
    })

    console.log('\n✅ Query thành công!')
  } catch (error: any) {
    console.error('❌ Lỗi khi query:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testModuleQuery()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script thất bại:', error)
    process.exit(1)
  })

