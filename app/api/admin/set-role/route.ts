import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (email === 'admin@grab.com') {
      await db.update(user).set({ role: 'admin' }).where(eq(user.email, 'admin@grab.com'))
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to set role' }, { status: 500 })
  }
}
