import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth, getUserRole } from '@/lib/auth'
import { headers } from 'next/headers'
import { logAdminAction } from '@/lib/discord-log'

export async function POST(req: NextRequest) {
  try {
    // Require authenticated admin session
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - not logged in' }, { status: 401 })
    }

    const requesterRole = await getUserRole(session.user.id)
    if (requesterRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin role required' }, { status: 403 })
    }

    const { email, userId, role } = await req.json()
    if (!role || !['driver', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Use "driver" or "admin".' }, { status: 400 })
    }

    if (email) {
      await db.update(user).set({ role }).where(eq(user.email, email))
      await logAdminAction('Set Role', session.user.id, { email, newRole: role, by: session.user.email })
      return NextResponse.json({ success: true })
    }

    if (userId) {
      await db.update(user).set({ role }).where(eq(user.id, userId))
      await logAdminAction('Set Role', session.user.id, { userId, newRole: role, by: session.user.email })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Email or userId required' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to set role' }, { status: 500 })
  }
}