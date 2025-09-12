'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createDefaultCollection } from '@/lib/supabase/helpers'

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .refine(val => !val.includes(' '), 'Username cannot contain spaces'),
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

    // Redirect on success - this will throw an error internally but that's expected
    redirect('/')
  } catch (error) {
    // Check if this is a redirect error (which is expected behavior)
    if (error && typeof error === 'object' && 'message' in error && error.message === 'NEXT_REDIRECT') {
      // This is a redirect error, which means login was successful
      // We should not return an error in this case
      throw error // Re-throw to let Next.js handle the redirect
    }
    
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
      } else {
        // Create default "My Favorites" collection for new user
        try {
          await createDefaultCollection(data.user.id)
        } catch (error) {
          console.error('Error creating default collection:', error)
          // Don't fail registration if collection creation fails
        }
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

// Password reset validation schema
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// Email update validation schema
const updateEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function resetPasswordAction(formData: FormData): Promise<AuthResult> {
  try {
    const rawFormData = {
      email: formData.get('email') as string,
    }

    // Validate form data
    const validatedFields = resetPasswordSchema.safeParse(rawFormData)
    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.issues[0]?.message || 'Invalid input',
      }
    }

    const { email } = validatedFields.data
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      error: 'Password reset link sent! Check your email.',
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function updateEmailAction(formData: FormData): Promise<AuthResult> {
  try {
    const rawFormData = {
      email: formData.get('email') as string,
    }

    // Validate form data
    const validatedFields = updateEmailSchema.safeParse(rawFormData)
    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.issues[0]?.message || 'Invalid input',
      }
    }

    const { email } = validatedFields.data
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Update user email
    const { error } = await supabase.auth.updateUser({
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
      error: 'Email update initiated! Check your new email for confirmation.',
    }
  } catch (error) {
    console.error('Email update error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

// Username update validation schema
const updateUsernameSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .refine(val => !val.includes(' '), 'Username cannot contain spaces'),
})

export async function updateUsernameAction(formData: FormData): Promise<AuthResult> {
  try {
    const rawFormData = {
      username: formData.get('username') as string,
    }

    // Validate form data
    const validatedFields = updateUsernameSchema.safeParse(rawFormData)
    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.issues[0]?.message || 'Invalid input',
      }
    }

    const { username } = validatedFields.data
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User authentication error:', userError)
      return {
        success: false,
        error: 'User not authenticated',
      }
    }
    
    console.log('Current user ID:', user.id)
    console.log('Attempting to update username to:', username)
    
    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return {
        success: false,
        error: 'Profile not found',
      }
    }
    
    if (!existingProfile) {
      console.error('Profile not found for user:', user.id)
      return {
        success: false,
        error: 'Profile not found',
      }
    }
    
    console.log('Existing profile:', existingProfile)

    // Check if username is already taken
    console.log('Checking if username is already taken...')
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('name')
      .eq('name', username)
      .neq('id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Username availability check error:', checkError)
      return {
        success: false,
        error: 'Failed to check username availability',
      }
    }

    if (existingUser) {
      console.log('Username already taken by:', existingUser)
      return {
        success: false,
        error: 'Username already taken',
      }
    }
    
    console.log('Username is available')

    // Update username in profiles table
    console.log('Updating username in profiles table...')
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ name: username })
      .eq('id', user.id)
      .select()

    if (updateError) {
      console.error('Update error:', updateError)
      return {
        success: false,
        error: updateError.message,
      }
    }
    
    console.log('Update result:', updateResult)
    console.log('Username updated successfully')

    return {
      success: true,
      error: 'Username updated successfully!',
    }
  } catch (error) {
    console.error('Username update error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}