import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          const cookieOptions = {
            name,
            value,
            ...options,
            // Ensure cookies work in production
            httpOnly: options?.httpOnly ?? true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const
          }
          
          request.cookies.set(cookieOptions)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set(cookieOptions)
        },
        remove(name: string, options) {
          const cookieOptions = {
            name,
            value: '',
            ...options,
            // Ensure cookies work in production
            httpOnly: options?.httpOnly ?? true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const
          }
          
          request.cookies.set(cookieOptions)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set(cookieOptions)
        },
      },
    }
  )

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedRoutes = ['/admin', '/profile']
  const publicAuthRoutes = ['/login', '/register']
  const authCallbackRoutes = ['/auth/callback']
  const authSetupRoutes = ['/auth/setup-username']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  const isPublicAuthRoute = publicAuthRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  const isAuthCallbackRoute = authCallbackRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  const isAuthSetupRoute = authSetupRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Allow auth callback and setup routes to proceed without checks
  if (isAuthCallbackRoute || isAuthSetupRoute) {
    return response
  }

  // Redirect authenticated users away from login/register pages
  if (session && isPublicAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect unauthenticated users from protected routes to login
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
