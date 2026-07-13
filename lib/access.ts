import { auth, getUserRole } from '@/lib/auth'
import { headers } from 'next/headers'

export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export async function requireAdmin() {
  const currentUser = await requireUser()
  if (await getUserRole(currentUser.id) !== 'admin') throw new Error('Forbidden')
  return currentUser
}
