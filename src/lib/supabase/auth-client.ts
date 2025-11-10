import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { User as AuthUser } from '@supabase/supabase-js'
import type { User, UserInsert } from '@/types/database'

/**
 * Client-side authentication utility functions for Flowidly
 * For use in Client Components only
 */

// ===================================================
// CLIENT-SIDE AUTHENTICATION FUNCTIONS
// ===================================================

export interface SignUpData {
  email: string
  password: string
  fullName?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  error?: string
  user?: AuthUser
  userProfile?: User
  requiresEmailConfirmation?: boolean
}

/**
 * Sign up a new user (client-side)
 * User profile is automatically created by database trigger
 * Requires email confirmation by default
 */
export async function signUp(data: SignUpData): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient()
    
    // Create auth user - profile will be auto-created by database trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      return {
        success: false,
        error: authError.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user account',
      }
    }

    // Check if email confirmation is required
    const requiresEmailConfirmation = authData.user.identities?.length === 0

    return {
      success: true,
      user: authData.user,
      requiresEmailConfirmation,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Sign in an existing user (client-side)
 * Authentication only - profile is fetched server-side
 */
export async function signIn(data: SignInData): Promise<AuthResult> {
  console.log('🔑 [auth-client] signIn called with email:', data.email)
  
  try {
    const supabase = createBrowserClient()
    console.log('📱 [auth-client] Supabase client created')
    
    console.log('🔐 [auth-client] Calling Supabase signInWithPassword...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    console.log('📦 [auth-client] Supabase response:', { 
      hasUser: !!authData?.user,
      hasSession: !!authData?.session,
      hasError: !!authError,
      errorMessage: authError?.message 
    })

    if (authError) {
      console.log('❌ [auth-client] Auth error:', authError)
      return {
        success: false,
        error: authError.message,
      }
    }

    if (!authData.user) {
      console.log('❌ [auth-client] No user in response')
      return {
        success: false,
        error: 'Authentication failed',
      }
    }

    console.log('✅ [auth-client] Sign in successful!', {
      userId: authData.user.id,
      email: authData.user.email,
      emailConfirmed: authData.user.email_confirmed_at
    })

    // Just return success - the profile will be fetched by server components
    return {
      success: true,
      user: authData.user,
    }
  } catch (error) {
    console.error('💥 [auth-client] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Sign out the current user (client-side)
 */
export async function signOutClient(): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Reset password for a user (client-side)
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Update user password (client-side)
 * User must be authenticated
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient()
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Get the current session (client-side)
 * Returns null if no active session
 */
export async function getSession() {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Validate password strength
 * Returns error message if password is weak, undefined if strong
 */
export function validatePassword(password: string): string | undefined {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long'
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter'
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter'
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }
  
  return undefined
}

/**
 * Calculate password strength score (0-4)
 * 0: Very weak, 4: Very strong
 */
export function getPasswordStrength(password: string): number {
  let strength = 0
  
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  
  return Math.min(strength, 4)
}

/**
 * Ensure user profile exists in public.users table (utility function)
 * Creates profile if it doesn't exist
 * @param userId - The auth user's ID
 * @param email - User's email
 * @param fullName - User's full name (optional)
 */
export async function ensureUserProfile(
  userId: string,
  email: string,
  fullName?: string | null
): Promise<User | null> {
  const supabase = createBrowserClient()
  
  // Check if profile exists
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (existing) return existing
  
  // Create profile if it doesn't exist
  const newProfile: UserInsert = {
    id: userId,
    email,
    full_name: fullName || null,
    role: 'admin',
  }
  
  const { data: created } = await supabase
    .from('users')
    .insert(newProfile)
    .select()
    .single()
  
  return created
}

/**
 * Get the current user profile from public.users table (client-side)
 * @returns User profile object or null if not found
 */
export async function getUserClient(): Promise<User | null> {
  const supabase = createBrowserClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) return null
  
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()
  
  return userProfile
}

