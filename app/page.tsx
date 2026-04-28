import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/layout/DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <DashboardClient
      user={{
        id: user.id,
        email: user.email!,
        user_metadata: user.user_metadata,
      }}
    />
  )
}
