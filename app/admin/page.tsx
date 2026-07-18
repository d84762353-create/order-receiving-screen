import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth, getUserRole } from '@/lib/auth'
import { getAdminDashboardData } from '@/app/actions/admin'
import { AdminDashboard } from '@/components/admin-dashboard'

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return redirect('/admin/login')
  
  // Check if user has admin role
  const role = await getUserRole(session.user.id)
  if (role !== 'admin') {
    // Not an admin - redirect to admin login
    return redirect('/admin/login')
  }
  
  const data = await getAdminDashboardData()
  
  return <AdminDashboard data={data} adminUser={{ name: session.user.name, email: session.user.email }} />
}
