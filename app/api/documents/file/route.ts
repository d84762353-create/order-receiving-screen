import { get } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { auth, getUserRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { driverDocuments } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { verifyDocumentToken } from '@/lib/document-token'

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get('pathname') || ''
  const expires = Number(request.nextUrl.searchParams.get('expires'))
  const token = request.nextUrl.searchParams.get('token') || ''
  const signedAccess = Number.isFinite(expires) && verifyDocumentToken(pathname, expires, token)

  if (!signedAccess) {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = await getUserRole(session.user.id)
    if (role !== 'admin') {
      const [owned] = await db.select({ id: driverDocuments.id }).from(driverDocuments).where(and(eq(driverDocuments.pathname, pathname), eq(driverDocuments.userId, session.user.id))).limit(1)
      if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const result = await get(pathname, { access: 'private', ifNoneMatch: request.headers.get('if-none-match') || undefined })
  if (!result) return new NextResponse('Tidak ditemukan', { status: 404 })
  if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers: { ETag: result.blob.etag, 'Cache-Control': 'private, no-cache' } })
  return new NextResponse(result.stream, { headers: { 'Content-Type': result.blob.contentType, ETag: result.blob.etag, 'Cache-Control': 'private, no-cache' } })
}
