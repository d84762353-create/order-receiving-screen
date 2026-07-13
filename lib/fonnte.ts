import { db } from '@/lib/db'
import { appSettings, whatsappLogs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const API_URL = 'https://api.fonnte.com'

function token() {
  const value = process.env.FONNTE_TOKEN
  if (!value) throw new Error('FONNTE_TOKEN belum dikonfigurasi')
  return value
}

async function fonnteRequest(path: string, body?: URLSearchParams) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: token() },
    body,
    cache: 'no-store',
  })
  const text = await response.text()
  let data: unknown = text
  try { data = JSON.parse(text) } catch {}
  if (!response.ok) throw new Error(`Fonnte ${response.status}: ${text.slice(0, 300)}`)
  return data
}

export async function syncFonnteGroups() {
  await fonnteRequest('/fetch-group')
  return fonnteRequest('/get-whatsapp-group')
}

export async function getWhatsAppTarget() {
  const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, 'fonnte_target')).limit(1)
  return setting?.value || process.env.FONNTE_TARGET || ''
}

export async function sendWhatsApp(event: string, message: string, userId?: string, attachmentUrl?: string) {
  const target = await getWhatsAppTarget()
  const [log] = await db.insert(whatsappLogs).values({ event, userId, target, message }).returning()
  if (!target) {
    await db.update(whatsappLogs).set({ status: 'failed', attempts: 1, lastError: 'Target grup belum dipilih' }).where(eq(whatsappLogs.id, log.id))
    return { ok: false, error: 'Target grup belum dipilih' }
  }
  try {
    const body = new URLSearchParams({ target, message, delay: '2', countryCode: '62' })
    if (attachmentUrl) body.set('url', attachmentUrl)
    const result = await fonnteRequest('/send', body)
    await db.update(whatsappLogs).set({ status: 'sent', attempts: 1, response: JSON.stringify(result), sentAt: new Date() }).where(eq(whatsappLogs.id, log.id))
    return { ok: true, result }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Pengiriman gagal'
    await db.update(whatsappLogs).set({ status: 'failed', attempts: 1, lastError: detail }).where(eq(whatsappLogs.id, log.id))
    return { ok: false, error: detail }
  }
}
