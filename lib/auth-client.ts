import { createAuthClient } from 'better-auth/react'

const baseURL = typeof window !== 'undefined'
  ? window.location.origin
  : process.env.BETTER_AUTH_URL || `https://order-receiving-screen.vercel.app`

export const authClient = createAuthClient({
  baseURL
})