'use client'

import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { LogOut } from 'lucide-react'

export function NavigationClient() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [openSchools, setOpenSchools] = useState(false)
  const [openPrograms, setOpenPrograms] = useState(false)
  const [openAccount, setOpenAccount] = useState(false)
  
  const handleLogoutClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const confirmed = typeof window === 'undefined' ? true : window.confirm('Are you sure you want to log out?')
    if (confirmed) {
      const form = e.currentTarget.closest('form') as HTMLFormElement | null
      form?.submit()
    }
  }

  const regions = [
    'United States',
    'United Kingdom',
    'Canada',
    'Europe',
    'Asia',
    'Australia',
  ] as const

  useEffect(() => {
    const supabase = createClient()
    
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        
        setIsAdmin(profile?.is_admin || false)
      }
      
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        if (session?.user) {
          // Re-check admin status when user changes
          supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single()
            .then(({ data: profile }) => {
              setIsAdmin(profile?.is_admin || false)
            })
        } else {
          setIsAdmin(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <nav className="flex items-center gap-4">
        <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
      </nav>
    )
  }

  return (
    <nav className="flex items-center gap-4">
      {user ? (
        // Authenticated user navigation
        <>
          <div onMouseEnter={() => setOpenSchools(true)} onMouseLeave={() => setOpenSchools(false)}>
            <DropdownMenu open={openSchools} onOpenChange={setOpenSchools}>
              <DropdownMenuTrigger asChild>
                <Button asChild variant="ghost"><Link href="/schools">Schools</Link></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
              {regions.map((r) => (
                <DropdownMenuItem key={r} onClick={() => router.push(`/schools?search=${encodeURIComponent(r)}`)}>
                  {r}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => router.push('/schools')}>All Regions</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div onMouseEnter={() => setOpenPrograms(true)} onMouseLeave={() => setOpenPrograms(false)}>
            <DropdownMenu open={openPrograms} onOpenChange={setOpenPrograms}>
              <DropdownMenuTrigger asChild>
                <Button asChild variant="ghost"><Link href="/programs">Programs</Link></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
              {regions.map((r) => (
                <DropdownMenuItem key={r} onClick={() => router.push(`/programs?search=${encodeURIComponent(r)}`)}>
                  {r}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => router.push('/programs')}>All Regions</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div onMouseEnter={() => setOpenAccount(true)} onMouseLeave={() => setOpenAccount(false)}>
            <DropdownMenu open={openAccount} onOpenChange={setOpenAccount}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="cursor-pointer">Account</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => router.push('/profile')}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/collections')}>Collections</DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push('/admin/dashboard')}>Admin</DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <form action="/api/auth/logout" method="post" className="w-full">
                    <button type="button" onClick={handleLogoutClick} className="flex items-center gap-2">
                      <span>Logout</span>
                      <LogOut className="w-4 h-4" />
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
        </>
      ) : (
        // Guest navigation
        <>
          <div onMouseEnter={() => setOpenSchools(true)} onMouseLeave={() => setOpenSchools(false)}>
            <DropdownMenu open={openSchools} onOpenChange={setOpenSchools}>
              <DropdownMenuTrigger asChild>
                <Button asChild variant="ghost"><Link href="/schools">Schools</Link></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
              {regions.map((r) => (
                <DropdownMenuItem key={r} onClick={() => router.push(`/schools?search=${encodeURIComponent(r)}`)}>
                  {r}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => router.push('/schools')}>All Regions</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div onMouseEnter={() => setOpenPrograms(true)} onMouseLeave={() => setOpenPrograms(false)}>
            <DropdownMenu open={openPrograms} onOpenChange={setOpenPrograms}>
              <DropdownMenuTrigger asChild>
                <Button asChild variant="ghost"><Link href="/programs">Programs</Link></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
              {regions.map((r) => (
                <DropdownMenuItem key={r} onClick={() => router.push(`/programs?search=${encodeURIComponent(r)}`)}>
                  {r}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => router.push('/programs')}>All Regions</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
