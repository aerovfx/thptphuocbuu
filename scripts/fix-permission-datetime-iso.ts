import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPermissionDateTimeISO() {
  try {
    console.log('Fetching all permissions with raw SQL...')
    // Use raw SQL to get the data as-is
    const permissions = await prisma.$queryRaw<Array<{ id: string; createdAt: string }>>`
      SELECT id, createdAt FROM permissions
    `
    
    console.log(`Found ${permissions.length} permissions`)
    
    let fixed = 0
    for (const perm of permissions) {
      const createdAt = perm.createdAt
      
      // Check if it's a Unix timestamp (milliseconds) - numeric string
      if (typeof createdAt === 'string' && /^\d+$/.test(createdAt)) {
        const timestamp = parseInt(createdAt, 10)
        const date = new Date(timestamp)
        const isoString = date.toISOString()
        
        console.log(`Fixing permission ${perm.id}: ${createdAt} -> ${isoString}`)
        
        await prisma.$executeRaw`
          UPDATE permissions 
          SET createdAt = ${isoString}
          WHERE id = ${perm.id}
        `
        
        fixed++
      } 
      // Check if it's in SQLite datetime format (YYYY-MM-DD HH:MM:SS)
      else if (typeof createdAt === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(createdAt)) {
        // Parse the SQLite datetime and convert to ISO
        const date = new Date(createdAt.replace(' ', 'T') + '.000Z')
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

fixPermissionDateTimeISO()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

