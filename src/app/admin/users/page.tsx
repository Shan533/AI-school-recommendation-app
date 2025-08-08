import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin, getSupabaseClient } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

async function getUsers() {
  const supabase = await getSupabaseClient()
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, is_admin, created_at')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    return []
  }

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.error('Error fetching auth users:', authError)
    return profiles?.map(profile => ({ ...profile, email: null })) || []
  }

  // Combine profile data with email from auth users
  const users = profiles?.map(profile => {
    const authUser = authUsers.users.find(user => user.id === profile.id)
    return {
      ...profile,
      email: authUser?.email || null
    }
  }) || []

  return users
}

async function toggleAdmin(formData: FormData) {
  'use server'
  
  const userId = formData.get('userId') as string
  const isAdmin = formData.get('isAdmin') === 'true'
  
  const supabase = await getSupabaseClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: !isAdmin })
    .eq('id', userId)
  
  if (error) {
    console.error('Error toggling admin status:', error)
  }
  
  redirect('/admin/users')
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

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {user.is_admin ? (
                    <Badge variant="destructive">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">User</Badge>
                  )}
                  <form action={toggleAdmin}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="isAdmin" value={user.is_admin.toString()} />
                    <Button 
                      type="submit" 
                      variant={user.is_admin ? "outline" : "default"}
                      size="sm"
                    >
                      {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}