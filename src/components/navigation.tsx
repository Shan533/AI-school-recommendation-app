import { getCurrentUser, isAdmin } from '@/lib/supabase/helpers'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export async function Navigation() {
  const user = await getCurrentUser()
  const userIsAdmin = user ? await isAdmin(user.id) : false

  return (
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
            <Link href="/profile">Profile</Link>
          </Button>
          {userIsAdmin && (
            <Button asChild variant="ghost">
              <Link href="/admin/dashboard">Admin</Link>
            </Button>
          )}
          <form action="/api/auth/logout" method="post">
            <Button type="submit" variant="outline" size="sm">
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
  )
}