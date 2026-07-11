import { NextResponse } from 'next/server'
import { getOperatorByIp } from '@/lib/ip-lookup'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  let ip = searchParams.get('ip')

  if (!ip) {
    // Coba ambil dari header pengunjung asli
    ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
    ip = ip.split(',')[0].trim()
  }

  const operator = getOperatorByIp(ip)

  return NextResponse.json({
    ip,
    operator,
    status: operator !== 'Unknown / IP Luar Negeri' ? 'Found' : 'Not Found'
  })
}
