import { getSession, getRole, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getSession()
  if (!session) redirect('/login')
  redirect(isAdmin(session) ? '/topics' : '/browse')
}
