import postgres from 'postgres'

const url = process.env.DATABASE_URL
const sql = postgres(url, { prepare: false, ssl: 'require', max: 1 })

const fixes = [
  // driver_profiles
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "nik" TEXT`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "simNumber" TEXT`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "address" TEXT`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "bankAccount" TEXT`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "bankName" TEXT`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "hasVerifiedDocuments" BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "photoKtp" TEXT`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "photoSim" TEXT`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "photoStnk" TEXT`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "photoSelfie" TEXT`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "photoVehicle" TEXT`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "has_paid_activation" BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "quietRideEnabled" BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "destinationDirection" TEXT`,
  `ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT`,

  // vehicles
  `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "stnkNumber" TEXT`,
  `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "color" TEXT`,
  `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "year" INTEGER`,

  // user
  `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'driver'`,
]

for (const stmt of fixes) {
  try {
    const name = stmt.match(/"([^"]+)"$/)?.[1] || stmt.match(/"([^"]+)"/g)?.[2]
    await sql.unsafe(stmt)
    console.log(`  ✓ ${stmt.substring(0, 80)}...`)
  } catch (e) {
    console.log(`  ✗ ${stmt.substring(0, 80)}... ${e.message}`)
  }
}

console.log('\nAll schema fixes applied!')
await sql.end()
