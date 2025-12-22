import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPermissionDateTime() {
  try {
    console.log('Fetching all permissions...')
    const permissions = await prisma.$queryRaw<Array<{ id: string; createdAt: string }>>`
      SELECT id, createdAt FROM permissions
    `
    
    console.log(`Found ${permissions.length} permissions`)
    
    let fixed = 0
    for (const perm of permissions) {
      const createdAt = perm.createdAt
      
      // Check if it's a Unix timestamp (milliseconds)
      if (typeof createdAt === 'string' && /^\d+$/.test(createdAt)) {
        const timestamp = parseInt(createdAt, 10)
        // Convert to ISO string
        const date = new Date(timestamp)
        const isoString = date.toISOString()
        
        console.log(`Fixing permission ${perm.id}: ${createdAt} -> ${isoString}`)
        
        await prisma.$executeRaw`
          UPDATE permissions 
          SET createdAt = ${isoString}
          WHERE id = ${perm.id}
        `
        
        fixed++
      } else if (typeof createdAt === 'number') {
        // Handle if it's already a number
        const date = new Date(createdAt)
        const isoString = date.toISOString()
        
        console.log(`Fixing permission ${perm.id}: ${createdAt} -> ${isoString}`)
        
        await prisma.$executeRaw`
          UPDATE permissions 
          SET createdAt = ${isoString}
          WHERE id = ${perm.id}
        `
        
        fixed++
      }
    }
    
    console.log(`Fixed ${fixed} permissions`)
  } catch (error) {
    console.error('Error fixing permissions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixPermissionDateTime()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

