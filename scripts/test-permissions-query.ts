import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testPermissionsQuery() {
  try {
    console.log('Testing permissions query...')
    
    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        resource: true,
        action: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      take: 5,
    })
    
    console.log(`Found ${permissions.length} permissions`)
    
    for (const p of permissions) {
      console.log(`Permission ${p.id}:`)
      console.log(`  - createdAt type: ${typeof p.createdAt}`)
      console.log(`  - createdAt value: ${p.createdAt}`)
      console.log(`  - createdAt instanceof Date: ${p.createdAt instanceof Date}`)
      
      if (p.createdAt instanceof Date) {
        console.log(`  - ISO string: ${p.createdAt.toISOString()}`)
      } else {
        console.log(`  - String value: ${String(p.createdAt)}`)
      }
    }
    
    console.log('Test completed successfully!')
  } catch (error) {
    console.error('Error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      name: error instanceof Error ? error.name : undefined,
      meta: (error as any)?.meta,
    })
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testPermissionsQuery()

