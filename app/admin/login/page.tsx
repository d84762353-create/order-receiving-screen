import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth, getUserRole } from '@/lib/auth'
import { AdminLoginForm } from '@/components/admin-login-form'

export default async function AdminLoginPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) {
    const role = await getUserRole(session.user.id)
    if (role === 'admin') {
      return redirect('/admin')
    } else {
      return redirect('/')
    }
  }
  return <AdminLoginForm />
}
