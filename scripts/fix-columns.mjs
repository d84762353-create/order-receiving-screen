import postgres from 'postgres'

const url = process.env.DATABASE_URL
const sql = postgres(url, { prepare: false, ssl: 'require', max: 1 })

await sql.unsafe(`ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "quietRideEnabled" BOOLEAN NOT NULL DEFAULT FALSE`)
await sql.unsafe(`ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "destinationDirection" TEXT`)
console.log('Missing columns added')
await sql.end()
