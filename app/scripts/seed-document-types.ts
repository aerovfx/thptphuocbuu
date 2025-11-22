/**
 * Seed Document Types
 * 
 * Chạy script này để seed các loại văn bản vào database
 * 
 * Usage: npx tsx scripts/seed-document-types.ts
 */

import { PrismaClient } from '@prisma/client'
// @ts-ignore - JSON import
import documentTypesData from '../../lib/document-types.json'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding document types...')

  const documentTypes = documentTypesData.documentTypes

  for (const docType of documentTypes) {
    try {
      await prisma.documentType.upsert({
        where: { code: docType.code },
        update: {
          name: docType.name,
          group: docType.group,
          description: docType.description || null,
          active: true,
          order: docType.order,
        },
        create: {
          code: docType.code,
          name: docType.name,
          group: docType.group,
          description: docType.description || null,
          active: true,
          order: docType.order,
        },
      })
      console.log(`✅ Seeded: ${docType.code} - ${docType.name}`)
    } catch (error) {
      console.error(`❌ Error seeding ${docType.code}:`, error)
    }
  }

  console.log(`\n✨ Seeded ${documentTypes.length} document types successfully!`)
}

main()
  .catch((e) => {
    console.error('Error seeding document types:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

