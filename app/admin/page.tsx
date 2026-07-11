import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getAdminDashboardData } from '@/app/actions/admin'
import { AdminDashboard } from '@/components/admin-dashboard'

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  
  const data = await getAdminDashboardData()
  
  return <AdminDashboard data={data} adminUser={{ name: session.user.name, email: session.user.email }} />
}
