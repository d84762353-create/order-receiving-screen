'use server'

import { auth, getUserRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { achievements, driverLocations, driverProfiles, earnings, notifications, orders, user, vehicles } from '@/lib/db/schema'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  
  const role = await getUserRole(session.user.id)
  if (role !== 'admin') throw new Error('Unauthorized - Admin only')
  
  return session.user.id
}

export async function getAdminDashboardData() {
  await getUserId()

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
    photoKtp: driverProfiles.photoKtp,
    photoSim: driverProfiles.photoSim,
    photoStnk: driverProfiles.photoStnk,
    photoSelfie: driverProfiles.photoSelfie,
    photoVehicle: driverProfiles.photoVehicle,
    createdAt: driverProfiles.createdAt
  })
  .from(driverProfiles)
  .leftJoin(user, eq(driverProfiles.userId, user.id))

  // Fetch all vehicles
  const vehiclesList = await db.select().from(vehicles)

  // Fetch all orders
  const ordersList = await db.select().from(orders).orderBy(desc(orders.createdAt))

  // Fetch all transactions
  const earningsList = await db.select().from(earnings).orderBy(desc(earnings.createdAt))

  return {
    drivers: driversList,
    vehicles: vehiclesList,
    orders: ordersList,
    earnings: earningsList
  }
}

export async function updateDriverVerification(profileId: number, status: 'approved' | 'pending' | 'suspended') {
  await getUserId()
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
  await getUserId()
  
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
  await getUserId()
  
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) throw new Error('Order tidak ditemukan')

  const timestamps: any = {}
  if (status === 'accepted') timestamps.acceptedAt = new Date()
  else if (status === 'picked_up') timestamps.pickedUpAt = new Date()
  else if (status === 'completed') timestamps.completedAt = new Date()
  else if (status === 'cancelled') timestamps.cancelledAt = new Date()

  await db.update(orders).set({ status, ...timestamps }).where(eq(orders.id, orderId))

  if (status === 'completed') {
    // Log earnings with commission deduction
    const commission = Math.round(order.fare * 0.20)
    await db.insert(earnings).values([
      {
        userId: order.userId,
        orderId: order.id,
        amount: order.fare,
        type: 'trip',
        description: `Admin Override: ${order.pickupAddress} → ${order.dropoffAddress}`
      },
      {
        userId: order.userId,
        orderId: order.id,
        amount: -commission,
        type: 'commission',
        description: `Komisi Layanan Grab (20%) - Admin Override`
      }
    ])
    await db.update(achievements)
      .set({ progress: sql`${achievements.progress} + 1` })
      .where(and(eq(achievements.userId, order.userId), inArray(achievements.code, ['first-trip', 'five-trips'])))
  }

  revalidatePath('/admin')
  revalidatePath('/')
}

export async function resetSystemData() {
  await getUserId()
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
