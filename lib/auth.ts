import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from './db'
import { eq } from 'drizzle-orm'
import * as schema from './db/schema'

const baseURL = process.env.BETTER_AUTH_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.V0_RUNTIME_URL)
const trustedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.V0_RUNTIME_URL,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
].filter(Boolean) as string[]

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'better-auth-secret-key-fallback-for-demo',
  baseURL,
  trustedOrigins,
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  advanced: { defaultCookieAttributes: { sameSite: 'lax' } },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'driver',
        input: false,
      }
    }
  }
})

// Helper to get user role from DB
export async function getUserRole(userId: string): Promise<string> {
  try {
    const [u] = await db.select({ role: schema.user.role }).from(schema.user).where(eq(schema.user.id, userId)).limit(1)
    return u?.role ?? 'driver'
  } catch {
    return 'driver'
  }
}

// Helper to set user role
export async function setUserRole(userId: string, role: string): Promise<void> {
  await db.update(schema.user).set({ role }).where(eq(schema.user.id, userId))
}
