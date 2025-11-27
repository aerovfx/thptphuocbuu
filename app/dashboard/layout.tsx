import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  // Safely get session with error handling for JWT decryption errors
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch (error: any) {
    // Handle JWT decryption errors - redirect to login
    if (
      error?.message?.includes('decryption') || 
      error?.code === 'JWT_SESSION_ERROR' ||
      error?.message?.includes('JWT') ||
      error?.name === 'JWTDecodeError'
    ) {
      // Session is invalid, redirect to login
      redirect('/login?error=SessionExpired')
    } else {
      // Log other errors but still redirect to login
      console.error('[Auth] Error getting session in dashboard layout:', error)
      redirect('/login?error=AuthError')
    }
  }

  if (!session) {
    redirect('/login')
  }

  // Layout is now handled by SharedLayout in each page
  return <>{children}</>
}

