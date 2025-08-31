import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin } from '@/lib/supabase/helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminSearchCard } from '@/components/admin/admin-search-card'
import { filterItems, searchConfigs } from '@/lib/admin-search'

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

async function toggleAdmin(formData: FormData) {
  'use server'
  
  const userId = formData.get('userId') as string
  const isAdmin = formData.get('isAdmin') === 'true'
  
  const supabaseAdmin = createAdminClient()
  
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_admin: !isAdmin })
    .eq('id', userId)
  
  if (error) {
    console.error('Error toggling admin status:', error)
  }
  
  redirect('/admin/users')
}

export default async function UsersManagement(props: {
  searchParams?: Promise<{ search?: string }>
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const userIsAdmin = await isAdmin(user.id)
  
  if (!userIsAdmin) {
    redirect('/')
  }

  const searchParams = await props.searchParams
  const search = searchParams?.search

  const allUsers = await getUsers()
  
  // Filter users based on search
  const users = filterItems(allUsers, {
    fields: searchConfigs.users.fields,
    searchTerm: search || ''
  })

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button asChild>
          <a href="/admin/dashboard">Back to Dashboard</a>
        </Button>
      </div>

      {/* Search Users */}
      <AdminSearchCard 
        placeholder={searchConfigs.users.placeholder}
        helpText={searchConfigs.users.helpText}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {search ? `Search Results (${users.length})` : `All Users (${users.length})`}
          </CardTitle>
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