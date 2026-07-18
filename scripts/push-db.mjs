import postgres from 'postgres'

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!url) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const sql = postgres(url, { prepare: false, ssl: 'require', max: 1 })

const tables = [
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '' UNIQUE, "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "image" TEXT, "role" TEXT NOT NULL DEFAULT 'driver',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT PRIMARY KEY, "expiresAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "token" TEXT NOT NULL DEFAULT '' UNIQUE, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(), "ipAddress" TEXT, "userAgent" TEXT,
    "userId" TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT PRIMARY KEY, "accountId" TEXT NOT NULL DEFAULT '',
    "providerId" TEXT NOT NULL DEFAULT '', "userId" TEXT NOT NULL DEFAULT '',
    "accessToken" TEXT, "refreshToken" TEXT, "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP, "refreshTokenExpiresAt" TIMESTAMP,
    "scope" TEXT, "password" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT PRIMARY KEY, "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL, "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS "driver_profiles" (
    "id" SERIAL PRIMARY KEY, "userId" TEXT NOT NULL UNIQUE,
    "phone" TEXT, "city" TEXT DEFAULT 'Jakarta',
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "isOnline" BOOLEAN NOT NULL DEFAULT FALSE,
    "turboEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "quietRideEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "destinationDirection" TEXT,
    "rating" NUMERIC(3,2) NOT NULL DEFAULT '5.00',
    "acceptanceRate" INTEGER NOT NULL DEFAULT 100,
    "completionRate" INTEGER NOT NULL DEFAULT 100,
    "emergencyContact" TEXT, "nik" TEXT, "simNumber" TEXT,
    "address" TEXT, "bankAccount" TEXT, "bankName" TEXT,
    "hasVerifiedDocuments" BOOLEAN NOT NULL DEFAULT FALSE,
    "photoKtp" TEXT, "photoSim" TEXT, "photoStnk" TEXT,
    "photoSelfie" TEXT, "photoVehicle" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS "vehicles" (
    "id" SERIAL PRIMARY KEY, "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'motorcycle', "brand" TEXT,
    "model" TEXT, "plateNumber" TEXT, "color" TEXT,
    "year" INTEGER, "stnkNumber" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS "driver_locations" (
    "id" SERIAL PRIMARY KEY, "userId" TEXT NOT NULL UNIQUE,
    "latitude" NUMERIC(10,7) NOT NULL, "longitude" NUMERIC(10,7) NOT NULL,
    "heading" NUMERIC(6,2), "accuracy" NUMERIC(8,2),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS "orders" (
    "id" SERIAL PRIMARY KEY, "userId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL DEFAULT 'ride',
    "status" TEXT NOT NULL DEFAULT 'offered',
    "pickupAddress" TEXT NOT NULL,
    "pickupLatitude" NUMERIC(10,7) NOT NULL,
    "pickupLongitude" NUMERIC(10,7) NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "dropoffLatitude" NUMERIC(10,7) NOT NULL,
    "dropoffLongitude" NUMERIC(10,7) NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT, "fare" INTEGER NOT NULL,
    "distanceKm" NUMERIC(6,2), "durationMinutes" INTEGER,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "offeredAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "acceptedAt" TIMESTAMP, "pickedUpAt" TIMESTAMP,
    "completedAt" TIMESTAMP, "cancelledAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS "earnings" (
    "id" SERIAL PRIMARY KEY, "userId" TEXT NOT NULL,
    "orderId" INTEGER, "type" TEXT NOT NULL DEFAULT 'trip',
    "amount" INTEGER NOT NULL, "description" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS "notifications" (
    "id" SERIAL PRIMARY KEY, "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL, "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'system',
    "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS "achievements" (
    "id" SERIAL PRIMARY KEY, "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL, "title" TEXT NOT NULL,
    "description" TEXT, "progress" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL DEFAULT 1,
    "unlockedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
]

for (const stmt of tables) {
  await sql.unsafe(stmt)
  console.log('OK:', stmt.slice(0, 60) + '...')
}

console.log('\nAll tables created successfully!')
await sql.end()
