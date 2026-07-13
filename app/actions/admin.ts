'use server'

import { db } from '@/lib/db'
import { achievements, appSettings, auditLogs, driverDocuments, driverLocations, driverProfiles, earnings, notifications, orders, user, vehicles, whatsappLogs } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/access'
import { sendWhatsApp } from '@/lib/fonnte'

async function getAdminId() {
  return (await requireAdmin()).id
}

export async function getAdminDashboardData() {
  await getAdminId()

  // Fetch profiles joined with users
  const driversList = await db.select({
    id: driverProfiles.id,
    userId: driverProfiles.userId,
    name: user.name,
    email: user.email,
    phone: driverProfiles.phone,
    city: driverProfiles.city,
    verificationStatus: driverProfiles.verificationStatus,
    isOnline: driverProfiles.isOnline,
    turboEnabled: driverProfiles.turboEnabled,
    rating: driverProfiles.rating,
    acceptanceRate: driverProfiles.acceptanceRate,
    completionRate: driverProfiles.completionRate,
    createdAt: driverProfiles.createdAt
  })
  .from(driverProfiles)
  .leftJoin(user, eq(driverProfiles.userId, user.id))

  // Fetch all vehicles
  const vehiclesList = await db.select().from(vehicles)

  // Fetch all orders
  const ordersList = await db.select().from(orders).orderBy(desc(orders.createdAt))

  const earningsList = await db.select().from(earnings).orderBy(desc(earnings.createdAt))
  const documentsList = await db.select().from(driverDocuments).orderBy(desc(driverDocuments.createdAt))
  const whatsappList = await db.select().from(whatsappLogs).orderBy(desc(whatsappLogs.createdAt)).limit(100)
  const [targetSetting] = await db.select().from(appSettings).where(eq(appSettings.key, 'fonnte_target')).limit(1)

  return {
    drivers: driversList,
    vehicles: vehiclesList,
    orders: ordersList,
    earnings: earningsList,
    documents: documentsList,
    whatsappLogs: whatsappList,
    fonnteTarget: targetSetting?.value || process.env.FONNTE_TARGET || ''
  }
}

export async function updateDriverVerification(profileId: number, status: 'approved' | 'pending' | 'suspended') {
  await getAdminId()
  const [profile] = await db.update(driverProfiles).set({ verificationStatus: status }).where(eq(driverProfiles.id, profileId)).returning()
  
  if (profile) {
    // Insert notification for the driver
    await db.insert(notifications).values({
      userId: profile.userId,
      title: `Status Akun Diperbarui`,
      body: `Status pendaftaran kemitraan Anda telah diubah menjadi ${status.toUpperCase()} oleh Administrator.`,
      type: 'verification'
    })
  }
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function dispatchCustomOrder(data: {
  userId: string
  pickupAddress: string
  pickupLatitude: string
  pickupLongitude: string
  dropoffAddress: string
  dropoffLatitude: string
  dropoffLongitude: string
  customerName: string
  customerPhone: string
  fare: number
  paymentMethod: string
  serviceType: string
}) {
  await getAdminId()
  
  // Cancel any active orders for this user first
  await db.update(orders)
    .set({ status: 'cancelled', cancelledAt: new Date() })
    .where(and(eq(orders.userId, data.userId), sql`status NOT IN ('completed', 'cancelled')`))

  const [newOrder] = await db.insert(orders).values({
    userId: data.userId,
    serviceType: data.serviceType || 'ride',
    status: 'offered',
    pickupAddress: data.pickupAddress,
    pickupLatitude: data.pickupLatitude,
    pickupLongitude: data.pickupLongitude,
    dropoffAddress: data.dropoffAddress,
    dropoffLatitude: data.dropoffLatitude,
    dropoffLongitude: data.dropoffLongitude,
    customerName: data.customerName,
    customerPhone: data.customerPhone || '0812-3456-7890',
    fare: data.fare,
    distanceKm: '5.20', // default mock distance
    durationMinutes: 15, // default mock duration
    paymentMethod: data.paymentMethod || 'cash'
  }).returning()

  revalidatePath('/admin')
  revalidatePath('/')
  return newOrder
}

export async function updateOrderState(orderId: number, status: string) {
  await getAdminId()
  
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) throw new Error('Order tidak ditemukan')

  const timestamps: any = {}
  if (status === 'accepted') timestamps.acceptedAt = new Date()
  else if (status === 'picked_up') timestamps.pickedUpAt = new Date()
  else if (status === 'completed') timestamps.completedAt = new Date()
  else if (status === 'cancelled') timestamps.cancelledAt = new Date()

  await db.update(orders).set({ status, ...timestamps }).where(eq(orders.id, orderId))

  if (status === 'completed') {
    // Log earnings
    await db.insert(earnings).values({
      userId: order.userId,
      orderId: order.id,
      amount: order.fare,
      description: `Admin Override: ${order.pickupAddress} â†’ ${order.dropoffAddress}`
    })
    // Increment achievements
    await db.update(achievements)
      .set({ progress: sql`${achievements.progress} + 1` })
      .where(and(eq(achievements.userId, order.userId), sql`code IN ('first-trip', 'five-trips')`))
  }

  revalidatePath('/admin')
  revalidatePath('/')
}

export async function saveFonnteTarget(target: string) {
  const adminId = await getAdminId()
  if (!/^\d+@g\.us$/.test(target)) throw new Error('ID grup tidak valid')
  await db.insert(appSettings).values({ key: 'fonnte_target', value: target, updatedBy: adminId })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: target, updatedBy: adminId, updatedAt: new Date() } })
  await db.insert(auditLogs).values({ actorId: adminId, action: 'update_fonnte_target', entityType: 'setting', entityId: 'fonnte_target', metadata: JSON.stringify({ target }) })
  await sendWhatsApp('configuration_test', 'GRAB DRIVER: Grup ini berhasil dipilih sebagai tujuan notifikasi operasional.')
  revalidatePath('/admin')
}

export async function retryWhatsAppLog(logId: number) {
  await getAdminId()
  const [log] = await db.select().from(whatsappLogs).where(eq(whatsappLogs.id, logId)).limit(1)
  if (!log) throw new Error('Log tidak ditemukan')
  return sendWhatsApp(log.event, log.message, log.userId || undefined)
}

export async function resetSystemData() {
  await getAdminId()
  await db.delete(driverProfiles)
  await db.delete(vehicles)
  await db.delete(driverLocations)
  await db.delete(orders)
  await db.delete(earnings)
  await db.delete(notifications)
  await db.delete(achievements)
  
  revalidatePath('/admin')
  revalidatePath('/')
}
