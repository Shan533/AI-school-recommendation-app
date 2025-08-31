import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin } from '@/lib/supabase/helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import UserManagement from '@/components/admin/user-management'

async function getUsers() {
  const supabaseAdmin = createAdminClient()
  
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, name, is_admin, created_at')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    return []
  }

  const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (authError) {
    console.error('Error fetching auth users:', authError)
    return profiles?.map(profile => ({ ...profile, email: null })) || []
  }

  // Combine profile data with email from auth users
  const users = profiles?.map(profile => {
    const authUser = authUsers.find(user => user.id === profile.id)
    return {
      ...profile,
      email: authUser?.email || null
    }
  }) || []

  return users
}



export default async function UsersManagement() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const userIsAdmin = await isAdmin(user.id)
  
  if (!userIsAdmin) {
    redirect('/')
  }

  const users = await getUsers()

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button asChild>
          <a href="/admin/dashboard">Back to Dashboard</a>
        </Button>
      </div>

      <UserManagement initialUsers={users} currentUserId={user.id} />
    </div>
  )
}