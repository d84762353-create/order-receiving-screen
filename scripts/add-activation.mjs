import postgres from 'postgres'

const url = process.env.DATABASE_URL
const sql = postgres(url, { prepare: false, ssl: 'require', max: 1 })

await sql.unsafe(`ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "has_paid_activation" BOOLEAN NOT NULL DEFAULT FALSE`)
console.log('OK: has_paid_activation column added')

await sql.end()
