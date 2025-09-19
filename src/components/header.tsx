import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NavHoverMenu } from '@/components/nav-hover-menu'
import { AccountHoverMenu } from '@/components/account-hover-menu'

export async function Header() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = !!profile?.is_admin
  }

  return (
    <header className={`shrink-0 border-b bg-gray-50`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          AI School Recommend
        </Link>
        <nav className="flex items-center gap-4">
          <NavHoverMenu label="Schools" baseHref="/schools" regions={['United States','United Kingdom','Canada','Europe','Asia','Australia'] as const} />
          <NavHoverMenu label="Programs" baseHref="/programs" regions={['United States','United Kingdom','Canada','Europe','Asia','Australia'] as const} />

          {user ? (
            <AccountHoverMenu isAdmin={isAdmin} />
          ) : (
            <>
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
