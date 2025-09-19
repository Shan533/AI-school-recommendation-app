'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function NavigationClient() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

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
            <Button type="submit" variant="secondary" size="sm" className="cursor-pointer bg-black text-white">
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
