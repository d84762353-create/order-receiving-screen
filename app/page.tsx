import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth, getUserRole } from '@/lib/auth'
import { getDashboardData } from '@/app/actions/driver'
import { DriverApp } from '@/components/driver-app'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return redirect('/sign-in')

  const role = await getUserRole(session.user.id)
  if (role === 'admin') {
    return redirect('/admin')
  }

  const data = await getDashboardData()
  return <DriverApp data={data} user={{ name: session.user.name, email: session.user.email }} />
}
