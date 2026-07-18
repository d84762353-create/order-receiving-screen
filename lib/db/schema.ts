import { boolean, integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false), image: text('image'),
  role: text('role').notNull().default('driver'),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const session = pgTable('session', {
  id: text('id').primaryKey(), expiresAt: timestamp('expiresAt').notNull(), token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})
export const account = pgTable('account', {
  id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }), accessToken: text('accessToken'),
  refreshToken: text('refreshToken'), idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'), scope: text('scope'), password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const verification = pgTable('verification', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(), createdAt: timestamp('createdAt').defaultNow(), updatedAt: timestamp('updatedAt').defaultNow(),
})
export const driverProfiles = pgTable('driver_profiles', {
  id: serial('id').primaryKey(), userId: text('userId').notNull().unique(), phone: text('phone'), city: text('city').default('Jakarta'),
  verificationStatus: text('verificationStatus').notNull().default('pending'), isOnline: boolean('isOnline').notNull().default(false),
  turboEnabled: boolean('turboEnabled').notNull().default(true), quietRideEnabled: boolean('quietRideEnabled').notNull().default(false), destinationDirection: text('destinationDirection'),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('5.00'),
  acceptanceRate: integer('acceptanceRate').notNull().default(100), completionRate: integer('completionRate').notNull().default(100),
  emergencyContact: text('emergencyContact'), nik: text('nik'), simNumber: text('simNumber'), address: text('address'),
  bankAccount: text('bankAccount'), bankName: text('bankName'),   hasVerifiedDocuments: boolean('hasVerifiedDocuments').notNull().default(false),
  hasPaidActivation: boolean('has_paid_activation').notNull().default(false),
  photoKtp: text('photoKtp'), photoSim: text('photoSim'), photoStnk: text('photoStnk'), photoSelfie: text('photoSelfie'), photoVehicle: text('photoVehicle'),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(), userId: text('userId').notNull(), type: text('type').notNull().default('motorcycle'),
  brand: text('brand'), model: text('model'), plateNumber: text('plateNumber'), color: text('color'), year: integer('year'), stnkNumber: text('stnkNumber'), createdAt: timestamp('createdAt').notNull().defaultNow(),
})
export const driverLocations = pgTable('driver_locations', {
  id: serial('id').primaryKey(), userId: text('userId').notNull().unique(), latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(), heading: numeric('heading', { precision: 6, scale: 2 }),
  accuracy: numeric('accuracy', { precision: 8, scale: 2 }), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(), userId: text('userId').notNull(), serviceType: text('serviceType').notNull().default('ride'), status: text('status').notNull().default('offered'),
  pickupAddress: text('pickupAddress').notNull(), pickupLatitude: numeric('pickupLatitude', { precision: 10, scale: 7 }).notNull(), pickupLongitude: numeric('pickupLongitude', { precision: 10, scale: 7 }).notNull(),
  dropoffAddress: text('dropoffAddress').notNull(), dropoffLatitude: numeric('dropoffLatitude', { precision: 10, scale: 7 }).notNull(), dropoffLongitude: numeric('dropoffLongitude', { precision: 10, scale: 7 }).notNull(),
  customerName: text('customerName').notNull(), customerPhone: text('customerPhone'), fare: integer('fare').notNull(), distanceKm: numeric('distanceKm', { precision: 6, scale: 2 }), durationMinutes: integer('durationMinutes'),
  paymentMethod: text('paymentMethod').notNull().default('cash'), offeredAt: timestamp('offeredAt').notNull().defaultNow(), acceptedAt: timestamp('acceptedAt'), pickedUpAt: timestamp('pickedUpAt'), completedAt: timestamp('completedAt'), cancelledAt: timestamp('cancelledAt'), createdAt: timestamp('createdAt').notNull().defaultNow(),
})
export const earnings = pgTable('earnings', { id: serial('id').primaryKey(), userId: text('userId').notNull(), orderId: integer('orderId'), type: text('type').notNull().default('trip'), amount: integer('amount').notNull(), description: text('description'), createdAt: timestamp('createdAt').notNull().defaultNow() })
export const notifications = pgTable('notifications', { id: serial('id').primaryKey(), userId: text('userId').notNull(), title: text('title').notNull(), body: text('body').notNull(), type: text('type').notNull().default('system'), isRead: boolean('isRead').notNull().default(false), createdAt: timestamp('createdAt').notNull().defaultNow() })
export const achievements = pgTable('achievements', { id: serial('id').primaryKey(), userId: text('userId').notNull(), code: text('code').notNull(), title: text('title').notNull(), description: text('description'), progress: integer('progress').notNull().default(0), target: integer('target').notNull().default(1), unlockedAt: timestamp('unlockedAt'), createdAt: timestamp('createdAt').notNull().defaultNow() })
