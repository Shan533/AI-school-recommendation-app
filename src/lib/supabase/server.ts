import 'server-only'

import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * compatible with old code: accept cookieStore returned by await cookies(),
 * return "user" client (with RLS)
 * compatible with old code: accept cookieStore returned by await cookies(),
 * return "user" client (with RLS)
 */
export function createClient(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): SupabaseClient {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({
            name,
            value,
            ...options,
            httpOnly: options?.httpOnly ?? true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: options?.path ?? '/',
          })
        } catch {
          // may throw error in Server Component; ignore when middleware refreshes session
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
            expires: new Date(0),
            httpOnly: options?.httpOnly ?? true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: options?.path ?? '/',
          })
        } catch {}
      },
    },
  })
}

/**
 * optional no-param version: internal await cookies()
 * for RSC / Route Handler to get "user" client more simply.
 */
export async function getServerSupabaseUser(): Promise<SupabaseClient> {
  const cookieStore = await cookies() // ✅ need await in Next 15/PPR
  return createClient(cookieStore)
}

/**
 * admin (bypass RLS) server client.
 * can only be used on the server; do not be bundled into client.
 */
export function getServerSupabaseAdmin(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getServerSupabaseAdmin cannot be used on the client')
  }
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/** read current logged in user (return null if not) */
export async function getCurrentUser() {
  const supabase = await getServerSupabaseUser()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}
