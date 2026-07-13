import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/access'
import { syncFonnteGroups } from '@/lib/fonnte'

export async function POST() {
  try {
    await requireAdmin()
    const data = await syncFonnteGroups()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sinkronisasi gagal'
    return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500 })
  }
}
