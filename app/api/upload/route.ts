import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const docType = formData.get('type') as string | null

  if (!file || !docType) {
    return NextResponse.json({ error: 'File dan jenis dokumen wajib diisi' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' }, { status: 400 })
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 })
  }

  const validDocTypes = ['ktp', 'sim', 'stnk', 'selfie', 'vehicle']
  if (!validDocTypes.includes(docType)) {
    return NextResponse.json({ error: 'Jenis dokumen tidak valid' }, { status: 400 })
  }

  try {
    const uploadDir = join(process.cwd(), 'public', 'uploads', session.user.id)
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${docType}_${Date.now()}.${ext}`
    const filePath = join(uploadDir, fileName)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const url = `/uploads/${session.user.id}/${fileName}`

    return NextResponse.json({ url, fileName })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Gagal mengunggah file' }, { status: 500 })
  }
}
