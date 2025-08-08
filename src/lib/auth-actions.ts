'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export type AuthResult = {
  success: boolean
  error?: string
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  try {
    const rawFormData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    // Validate form data
    const validatedFields = loginSchema.safeParse(rawFormData)
    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.issues[0]?.message || 'Invalid input',
      }
    }

    const { email, password } = validatedFields.data
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Attempt to sign in
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Redirect on success
    redirect('/')
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function registerAction(formData: FormData): Promise<AuthResult> {
  try {
    const rawFormData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
    }

    // Validate form data
    const validatedFields = registerSchema.safeParse(rawFormData)
    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.issues[0]?.message || 'Invalid input',
      }
    }

    const { email, password, name } = validatedFields.data
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Create user profile if signup successful
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            name,
            is_admin: false,
          },
        ])

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't return error here as the user is created successfully
        // The profile can be created later
      }
    }

    // Check if email confirmation is required
    if (!data.session) {
      return {
        success: true,
        error: 'Please check your email to confirm your account',
      }
    }

    // Redirect on success
    redirect('/')
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function signInWithGoogleAction(): Promise<AuthResult & { url?: string }> {
  try {
    const cookieStore = await cookies()
    const headersList = await headers()
    const supabase = createClient(cookieStore)

    // Get the site URL from multiple sources
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    
    if (!siteUrl) {
      // Try to get from headers
      const host = headersList.get('host')
      const protocol = headersList.get('x-forwarded-proto') || 'http'
      
      if (host) {
        siteUrl = `${protocol}://${host}`
      } else if (process.env.VERCEL_URL) {
        siteUrl = `https://${process.env.VERCEL_URL}`
      } else {
        siteUrl = 'http://localhost:3000'
      }
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    if (data.url) {
      return {
        success: true,
        url: data.url
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Google sign-in error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function resendEmailVerification(email: string): Promise<AuthResult> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      error: 'Verification email sent successfully',
    }
  } catch (error) {
    console.error('Resend verification error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  await supabase.auth.signOut()
  redirect('/')
}