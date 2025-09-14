import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function Header() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check if user is admin
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    isAdmin = profile?.is_admin || false
  }

  return (
    <header className={`shrink-0 border-b bg-gray-50`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          AI School Recommend
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            // Authenticated user navigation
            <>
              <Button asChild variant="ghost">
                <Link href="/schools">Schools</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/programs">Programs</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/collections">My Collections</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/profile">Profile</Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="ghost">
                  <Link href="/admin/dashboard">Admin</Link>
                </Button>
              )}
              <form action="/api/auth/logout" method="post">
                <Button type="submit" variant="secondary" size="sm" className="cursor-pointer">
                  Logout
                </Button>
              </form>
            </>
          ) : (
            // Guest navigation
            <>
              <Button asChild variant="ghost">
                <Link href="/schools">Schools</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/programs">Programs</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
