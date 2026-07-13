'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { achievements, bankAccounts, driverDocuments, driverLocations, driverProfiles, earnings, notifications, orders, vehicles } from '@/lib/db/schema'
import { sendWhatsApp } from '@/lib/fonnte'
import { and, desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getDashboardData() {
  const userId = await getUserId()
  const [profile] = await db.select().from(driverProfiles).where(eq(driverProfiles.userId, userId)).limit(1)
  const orderList = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(20)
  const earningList = await db.select().from(earnings).where(eq(earnings.userId, userId)).orderBy(desc(earnings.createdAt)).limit(30)
  const inbox = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(20)
  const goals = await db.select().from(achievements).where(eq(achievements.userId, userId)).orderBy(desc(achievements.createdAt))
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.userId, userId)).limit(1)
  const documents = await db.select().from(driverDocuments).where(eq(driverDocuments.userId, userId)).orderBy(desc(driverDocuments.createdAt))
  return { profile: profile ?? null, orders: orderList, earnings: earningList, notifications: inbox, achievements: goals, vehicle: vehicle ?? null, documents }
}

export async function createDriverProfile(data: {
  phone: string; nationalId?: string; birthDate?: string; address?: string; city: string; brand: string; model: string; plateNumber: string;
  vehicleColor?: string; vehicleYear?: number; emergencyContact: string; emergencyPhone?: string; bankName?: string; accountNumber?: string; accountHolder?: string
}) {
  const userId = await getUserId()
  const documents = await db.select().from(driverDocuments).where(eq(driverDocuments.userId, userId))
  const required = ['selfie', 'ktp', 'sim', 'stnk', 'vehicle', 'bank_book']
  const missing = required.filter(type => !documents.some(document => document.type === type))
  if (missing.length) throw new Error(`Dokumen belum lengkap: ${missing.join(', ')}`)

  await db.insert(driverProfiles).values({
    userId, phone: data.phone, nationalId: data.nationalId, birthDate: data.birthDate, address: data.address, city: data.city,
    emergencyContact: data.emergencyContact, emergencyPhone: data.emergencyPhone, verificationStatus: 'pending', submittedAt: new Date(), updatedAt: new Date()
  }).onConflictDoUpdate({ target: driverProfiles.userId, set: { phone: data.phone, nationalId: data.nationalId, birthDate: data.birthDate, address: data.address, city: data.city, emergencyContact: data.emergencyContact, emergencyPhone: data.emergencyPhone, verificationStatus: 'pending', submittedAt: new Date(), updatedAt: new Date() } })
  const [existingVehicle] = await db.select().from(vehicles).where(eq(vehicles.userId, userId)).limit(1)
  if (existingVehicle) await db.update(vehicles).set({ brand: data.brand, model: data.model, plateNumber: data.plateNumber, color: data.vehicleColor, year: data.vehicleYear, updatedAt: new Date() }).where(and(eq(vehicles.id, existingVehicle.id), eq(vehicles.userId, userId)))
  else await db.insert(vehicles).values({ userId, brand: data.brand, model: data.model, plateNumber: data.plateNumber, color: data.vehicleColor, year: data.vehicleYear, type: 'motorcycle' })
  if (data.bankName && data.accountNumber && data.accountHolder) await db.insert(bankAccounts).values({ userId, bankName: data.bankName, accountNumber: data.accountNumber, accountHolder: data.accountHolder }).onConflictDoUpdate({ target: bankAccounts.userId, set: { bankName: data.bankName, accountNumber: data.accountNumber, accountHolder: data.accountHolder, updatedAt: new Date() } })
  await db.insert(notifications).values({ userId, title: 'Pendaftaran diterima', body: 'Data dan enam dokumen Anda telah diterima dan sedang diverifikasi admin.', type: 'verification' })
  await sendWhatsApp('registration_submitted', `PENDAFTARAN DRIVER BARU\nUser ID: ${userId}\nTelepon: ${data.phone}\nKota: ${data.city}\nKendaraan: ${data.brand} ${data.model}\nPlat: ${data.plateNumber}\nDokumen: lengkap (6/6)`, userId)
  revalidatePath('/')
}

export async function toggleOnline() {
  const userId = await getUserId()
  await db.update(driverProfiles).set({ isOnline: sql`NOT ${driverProfiles.isOnline}`, updatedAt: new Date() }).where(eq(driverProfiles.userId, userId))
  revalidatePath('/')
}

export async function toggleTurbo() {
  const userId = await getUserId()
  await db.update(driverProfiles).set({ turboEnabled: sql`NOT ${driverProfiles.turboEnabled}`, updatedAt: new Date() }).where(eq(driverProfiles.userId, userId))
  revalidatePath('/')
}

export async function updateLocation(latitude: number, longitude: number, accuracy?: number) {
  const userId = await getUserId()
  await db.insert(driverLocations).values({ userId, latitude: String(latitude), longitude: String(longitude), accuracy: accuracy ? String(accuracy) : null }).onConflictDoUpdate({ target: driverLocations.userId, set: { latitude: String(latitude), longitude: String(longitude), accuracy: accuracy ? String(accuracy) : null, updatedAt: new Date() } })
}

export async function updateOrder(orderId: number, nextStatus: string) {
  const userId = await getUserId()
  const allowed = ['accepted', 'arrived', 'picked_up', 'completed', 'cancelled']
  if (!allowed.includes(nextStatus)) throw new Error('Status tidak valid')
  const [order] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1)
  if (!order) throw new Error('Order tidak ditemukan')
  const timestamps = nextStatus === 'accepted' ? { acceptedAt: new Date() } : nextStatus === 'picked_up' ? { pickedUpAt: new Date() } : nextStatus === 'completed' ? { completedAt: new Date() } : nextStatus === 'cancelled' ? { cancelledAt: new Date() } : {}
  await db.update(orders).set({ status: nextStatus, ...timestamps }).where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
  if (nextStatus === 'completed') {
    const commission = Math.round(order.fare * 0.20)
    await db.insert(earnings).values([
      { userId, orderId, amount: order.fare, description: `${order.pickupAddress} → ${order.dropoffAddress}`, type: 'trip' },
      { userId, orderId, amount: -commission, description: `Komisi Layanan Grab (20%)`, type: 'commission' }
    ])
    await db.update(achievements).set({ progress: sql`${achievements.progress} + 1` }).where(and(eq(achievements.userId, userId), sql`code IN ('first-trip', 'five-trips')`))
  }
  revalidatePath('/')
}

export async function markNotificationRead(id: number) {
  const userId = await getUserId()
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
  revalidatePath('/')
}

export async function declineOrder(orderId: number) {
  const userId = await getUserId()
  await db.update(orders).set({ status: 'cancelled', cancelledAt: new Date() }).where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
  revalidatePath('/')
}

export async function withdrawFunds(amount: number, method: string) {
  const userId = await getUserId()
  const earningList = await db.select().from(earnings).where(eq(earnings.userId, userId))
  const cashBalance = earningList.filter(e => ['trip', 'withdrawal'].includes(e.type)).reduce((sum, item) => sum + item.amount, 0)
  if (amount <= 0) throw new Error('Jumlah penarikan harus lebih dari 0')
  if (amount > cashBalance) throw new Error('Saldo Dompet Tunai tidak mencukupi')
  await db.insert(earnings).values({ userId, amount: -amount, description: `Tarik Saldo (${method})`, type: 'withdrawal' })
  revalidatePath('/')
}

export async function resetDriverData() {
  const userId = await getUserId()
  await db.delete(driverProfiles).where(eq(driverProfiles.userId, userId))
  await db.delete(vehicles).where(eq(vehicles.userId, userId))
  await db.delete(driverLocations).where(eq(driverLocations.userId, userId))
  await db.delete(orders).where(eq(orders.userId, userId))
  await db.delete(earnings).where(eq(earnings.userId, userId))
  await db.delete(notifications).where(eq(notifications.userId, userId))
  await db.delete(achievements).where(eq(achievements.userId, userId))
  revalidatePath('/')
}

export async function addFakeEarnings() {
  const userId = await getUserId()
  await db.insert(earnings).values([
    { userId, amount: 50000, description: 'Bonus Simulasi Dev', type: 'trip' },
    { userId, amount: 20000, description: 'Top Up Kredit Simulasi', type: 'credit' }
  ])
  revalidatePath('/')
}

export async function simulateNewOrder() {
  const userId = await getUserId()
  // Cancel any existing pending or active orders
  await db.update(orders).set({ status: 'cancelled', cancelledAt: new Date() }).where(and(eq(orders.userId, userId), sql`status NOT IN ('completed', 'cancelled')`))

  const mockOrders = [
    {
      pickupAddress: 'Grand Indonesia (Lobby Amartha)', pickupLatitude: '-6.1953250', pickupLongitude: '106.8202960',
      dropoffAddress: 'Kuningan City Mall', dropoffLatitude: '-6.2248550', dropoffLongitude: '106.8298710',
      customerName: 'Budi Hartono', customerPhone: '08123456789', fare: 19000, distanceKm: '3.60', durationMinutes: 12
    },
    {
      pickupAddress: 'Plaza Senayan (Lobby Selatan)', pickupLatitude: '-6.2255750', pickupLongitude: '106.7997570',
      dropoffAddress: 'Pondok Indah Mall 2', dropoffLatitude: '-6.2697840', dropoffLongitude: '106.7828550',
      customerName: 'Siti Rahma', customerPhone: '08777654321', fare: 32000, distanceKm: '6.20', durationMinutes: 22
    },
    {
      pickupAddress: 'Stasiun Sudirman Baru (Bandara)', pickupLatitude: '-6.2012000', pickupLongitude: '106.8214000',
      dropoffAddress: 'Pacific Place Mall Jakarta', dropoffLatitude: '-6.2246730', dropoffLongitude: '106.8097720',
      customerName: 'Rian Wijaya', customerPhone: '08139988776', fare: 24000, distanceKm: '4.10', durationMinutes: 15
    },
    {
      pickupAddress: 'Mall Kelapa Gading 3', pickupLatitude: '-6.1583090', pickupLongitude: '106.9084320',
      dropoffAddress: 'Monumen Nasional (Monas)', dropoffLatitude: '-6.1753920', dropoffLongitude: '106.8271530',
      customerName: 'Dian Sastro', customerPhone: '08521122334', fare: 48000, distanceKm: '10.50', durationMinutes: 30
    },
    {
      pickupAddress: 'Central Park Mall (Lobby Lumina)', pickupLatitude: '-6.1772650', pickupLongitude: '106.7909320',
      dropoffAddress: 'Kota Tua Jakarta', dropoffLatitude: '-6.1348880', dropoffLongitude: '106.8133030',
      customerName: 'Adi Putra', customerPhone: '08998877665', fare: 29000, distanceKm: '5.80', durationMinutes: 19
    }
  ]

  const randomOrder = mockOrders[Math.floor(Math.random() * mockOrders.length)]
  await db.insert(orders).values({
    userId,
    serviceType: 'ride',
    status: 'offered',
    ...randomOrder,
    paymentMethod: Math.random() > 0.5 ? 'Gopay' : 'cash'
  })
  revalidatePath('/')
}

