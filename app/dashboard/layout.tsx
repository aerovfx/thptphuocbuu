import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth-helpers'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  // Safely get session with error handling for JWT decryption errors
  // getCurrentSession() handles JWT errors gracefully and suppresses console errors
  const session = await getCurrentSession()

  if (!session) {
    redirect('/login?error=SessionExpired')
  }

  // Layout is now handled by SharedLayout in each page
  return <>{children}</>
}

