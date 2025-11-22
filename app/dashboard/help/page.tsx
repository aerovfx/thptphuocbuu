import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import HelpPage from '@/components/Help/HelpPage'

export default async function HelpPageRoute() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  return <HelpPage currentUser={session} />
}

