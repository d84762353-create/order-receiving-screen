import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminLoginForm } from '@/components/admin-login-form'

export default async function AdminLoginPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) {
    // If already logged in, go to admin dashboard
    redirect('/admin')
  }
  return <AdminLoginForm />
}
