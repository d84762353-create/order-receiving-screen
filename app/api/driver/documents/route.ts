import { put } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { driverDocuments } from '@/lib/db/schema'
import { requireUser } from '@/lib/access'
import { createDocumentToken } from '@/lib/document-token'
import { sendWhatsApp } from '@/lib/fonnte'

const allowedTypes = new Set(['selfie', 'ktp', 'sim', 'stnk', 'vehicle', 'bank_book'])
const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser()
    const formData = await request.formData()
    const file = formData.get('file')
    const type = String(formData.get('type') || '')
    if (!(file instanceof File) || !allowedTypes.has(type)) return NextResponse.json({ error: 'Dokumen tidak valid' }, { status: 400 })
    if (!allowedMime.has(file.type) || file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Gunakan JPG, PNG, WebP, atau PDF maksimal 8 MB' }, { status: 400 })

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const blob = await put(`drivers/${currentUser.id}/${type}-${Date.now()}-${safeName}`, file, { access: 'private', addRandomSuffix: true })
    const [document] = await db.insert(driverDocuments).values({ userId: currentUser.id, type, pathname: blob.pathname, originalName: file.name, contentType: file.type, size: file.size })
      .onConflictDoUpdate({ target: [driverDocuments.userId, driverDocuments.type], set: { pathname: blob.pathname, originalName: file.name, contentType: file.type, size: file.size, status: 'pending', updatedAt: new Date() } }).returning()

    const expiresAt = Date.now() + 15 * 60 * 1000
    const token = createDocumentToken(blob.pathname, expiresAt)
    const attachmentUrl = `${request.nextUrl.origin}/api/documents/file?pathname=${encodeURIComponent(blob.pathname)}&expires=${expiresAt}&token=${token}`
    await sendWhatsApp('document_uploaded', `Dokumen ${type.toUpperCase()} diunggah oleh ${currentUser.name} (${currentUser.email}).`, currentUser.id, attachmentUrl)
    return NextResponse.json({ document: { id: document.id, type: document.type, status: document.status, originalName: document.originalName } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload gagal'
    return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 500 })
  }
}
