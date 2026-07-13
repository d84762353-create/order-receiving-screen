import { createHmac, timingSafeEqual } from 'node:crypto'

function secret() {
  if (!process.env.BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET belum dikonfigurasi')
  return process.env.BETTER_AUTH_SECRET
}

export function createDocumentToken(pathname: string, expiresAt: number) {
  return createHmac('sha256', secret()).update(`${pathname}:${expiresAt}`).digest('hex')
}

export function verifyDocumentToken(pathname: string, expiresAt: number, token: string) {
  if (!token || Date.now() > expiresAt) return false
  const expected = createDocumentToken(pathname, expiresAt)
  const actualBuffer = Buffer.from(token)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}
