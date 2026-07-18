import postgres from 'postgres'

const url = process.env.DATABASE_URL
const sql = postgres(url, { prepare: false, ssl: 'require', max: 1 })

await sql.unsafe(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "stnkNumber" TEXT`)
await sql.unsafe(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "color" TEXT`)
await sql.unsafe(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "year" INTEGER`)

console.log('Vehicles columns fixed (quoted)')
await sql.end()
