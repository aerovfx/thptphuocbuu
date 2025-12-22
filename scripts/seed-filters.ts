import { PrismaClient } from '@prisma/client'
import { seedContentFilters } from '../lib/content-moderation'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding content filters...')

    // Get first admin user
    const adminUser = await prisma.user.findFirst({
        where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }
        }
    })

    if (!adminUser) {
        console.error('❌ No admin user found. Please create an admin user first.')
        process.exit(1)
    }

    console.log(`✅ Found admin user: ${adminUser.email}`)

    // Seed filters
    const count = await seedContentFilters(adminUser.id)

    console.log(`✅ Seeded ${count} content filters successfully!`)

    // Display summary
    const filters = await prisma.contentFilter.findMany({
        orderBy: { severity: 'asc' },
        select: {
            keyword: true,
            category: true,
            severity: true,
            replacement: true,
        }
    })

    console.log('\n📋 Filter Summary:')
    console.log('─'.repeat(80))
    filters.forEach(f => {
        const severityIcon = {
            FORBIDDEN: '🔴',
            RESTRICTED: '🟠',
            CONDITIONAL: '🟡',
            ALLOWED: '🟢',
        }[f.severity] || '⚪'

        console.log(`${severityIcon} ${f.keyword.padEnd(15)} | ${f.category.padEnd(15)} | ${f.replacement || '(no replacement)'}`)
    })
    console.log('─'.repeat(80))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
