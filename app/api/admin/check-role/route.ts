import { NextResponse } from 'next/server'
import { auth, getUserRole } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ role: null, error: 'Not authenticated' }, { status: 401 })
    }
    const role = await getUserRole(session.user.id)
    return NextResponse.json({ role })
  } catch {
    return NextResponse.json({ role: 'driver' })
  }
}
