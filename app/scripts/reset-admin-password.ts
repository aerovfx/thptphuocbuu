import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'admin@example.com'
  const newPassword = process.argv[3] || 'admin123'

  console.log(`🔐 Resetting password for: ${email}`)
  
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.error(`❌ User not found: ${email}`)
    process.exit(1)
  }

  console.log(`✅ Found user: ${user.firstName} ${user.lastName}`)
  
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  console.log(`✅ Password reset successfully!`)
  console.log(`   Email: ${email}`)
  console.log(`   New password: ${newPassword}`)
  
  // Verify the password
  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  })
  
  if (updatedUser?.password) {
    const isValid = await bcrypt.compare(newPassword, updatedUser.password)
    console.log(`   Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`)
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

