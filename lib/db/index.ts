import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!connectionString) {
  console.warn('[DB] No DATABASE_URL set. Set it for persistent storage.')
  throw new Error('DATABASE_URL environment variable is required')
}

console.log('[DB] Connecting to PostgreSQL...')
const sql = postgres(connectionString, { prepare: false, ssl: 'require', max: 10 })
export const db = drizzle(sql, { schema })
console.log('[DB] Connected successfully')
