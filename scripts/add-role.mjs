import postgres from 'postgres'

const url = process.env.DATABASE_URL
const sql = postgres(url, { prepare: false, ssl: 'require', max: 1 })

await sql.unsafe(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'driver'`)
console.log('Added role column to user table')

await sql.unsafe(`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "userId" TEXT`)
await sql.unsafe(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "userId" TEXT`)

console.log('All migrations applied')
await sql.end()
