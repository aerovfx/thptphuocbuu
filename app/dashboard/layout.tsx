import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentSession } from '@/lib/auth-helpers'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  // Kiểm tra xem đây có phải trang công khai không (do middleware gắn header)
  const headersList = await headers()
  const isPublicPath = headersList.get('x-is-public-path') === '1'

  // Nếu là trang công khai (văn bản, spaces, departments) → không yêu cầu đăng nhập
  if (isPublicPath) {
    return <>{children}</>
  }

  // Safely get session with error handling for JWT decryption errors
  // getCurrentSession() handles JWT errors gracefully and suppresses console errors
  const session = await getCurrentSession()

  if (!session) {
    redirect('/login?error=SessionExpired')
  }

  // Layout is now handled by SharedLayout in each page
  return <>{children}</>
}

