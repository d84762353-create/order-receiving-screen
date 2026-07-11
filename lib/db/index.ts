import { newDb } from 'pg-mem'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

// Create a pg-mem database in-memory
const memDb = newDb()

// Get Pool constructor using standard pg-mem adapter API
const { Pool } = memDb.adapters.createPg()
export const pool = new Pool()
export const db = drizzle(pool, { schema })

// Automatically initialize schema tables if they do not exist
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
        "image" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "session" (
        "id" TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        "scope" TEXT,
        "password" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "driver_profiles" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "phone" TEXT,
        "city" TEXT DEFAULT 'Jakarta',
        "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
        "isOnline" BOOLEAN NOT NULL DEFAULT FALSE,
        "turboEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
        "rating" NUMERIC(3,2) NOT NULL DEFAULT '5.00',
        "acceptanceRate" INTEGER NOT NULL DEFAULT 100,
        "completionRate" INTEGER NOT NULL DEFAULT 100,
        "emergencyContact" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "vehicles" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'motorcycle',
        "brand" TEXT,
        "model" TEXT,
        "plateNumber" TEXT,
        "color" TEXT,
        "year" INTEGER,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "driver_locations" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "latitude" NUMERIC(10,7) NOT NULL,
        "longitude" NUMERIC(10,7) NOT NULL,
        "heading" NUMERIC(6,2),
        "accuracy" NUMERIC(8,2),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "serviceType" TEXT NOT NULL DEFAULT 'ride',
        "status" TEXT NOT NULL DEFAULT 'offered',
        "pickupAddress" TEXT NOT NULL,
        "pickupLatitude" NUMERIC(10,7) NOT NULL,
        "pickupLongitude" NUMERIC(10,7) NOT NULL,
        "dropoffAddress" TEXT NOT NULL,
        "dropoffLatitude" NUMERIC(10,7) NOT NULL,
        "dropoffLongitude" NUMERIC(10,7) NOT NULL,
        "customerName" TEXT NOT NULL,
        "customerPhone" TEXT,
        "fare" INTEGER NOT NULL,
        "distanceKm" NUMERIC(6,2),
        "durationMinutes" INTEGER,
        "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
        "offeredAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "acceptedAt" TIMESTAMP,
        "pickedUpAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "cancelledAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "earnings" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "orderId" INTEGER,
        "type" TEXT NOT NULL DEFAULT 'trip',
        "amount" INTEGER NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'system',
        "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "achievements" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "progress" INTEGER NOT NULL DEFAULT 0,
        "target" INTEGER NOT NULL DEFAULT 1,
        "unlockedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)
  } catch (err) {
    console.error("Failed to initialize pg-mem database tables:", err)
  }
}
initDatabase()
