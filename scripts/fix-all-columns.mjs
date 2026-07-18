import postgres from 'postgres'

const url = process.env.DATABASE_URL
const sql = postgres(url, { prepare: false, ssl: 'require', max: 1 })

const alterStatements = [
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
]

for (const stmt of alterStatements) {
  try {
    await sql.unsafe(stmt)
    const name = stmt.match(/"([^"]+)"/g)?.[1]?.replace(/"/g, '')
    console.log(`  ✓ ${name}`)
  } catch (e) {
    console.log(`  ✗ ${stmt.substring(0, 60)}: ${e.message}`)
  }
}

console.log('\nAll columns fixed!')
await sql.end()
