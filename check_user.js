
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const email = 'thegioithu2@gmail.com'
    console.log(`Searching for user with email: ${email}`)
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    })

    if (user) {
        console.log('User found:')
        console.log(JSON.stringify(user, null, 2))
    } else {
        console.log('User NOT found in database.')
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
