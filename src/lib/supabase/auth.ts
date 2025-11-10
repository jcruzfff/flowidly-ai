import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import type { User as AuthUser } from '@supabase/supabase-js'
import type { User, UserInsert, UserRole } from '@/types/database'

/**
 * Authentication utility functions for Flowidly
 * Provides server-side and client-side authentication methods
 * Integrates with both auth.users and public.users tables
 */

// ===================================================
// SERVER-SIDE AUTHENTICATION FUNCTIONS
// ===================================================

/**
 * Get the current authenticated user from auth (server-side)
 * @returns Auth user object or null if not authenticated
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get the current user profile from public.users table (server-side)
 * @returns User profile object or null if not found
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) return null
  
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()
  
  return userProfile
}

/**
 * Sign out the current user (server-side)
 * Redirects to home page after successful sign out
 */
export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/')
}

/**
 * Require authentication (server-side)
 * Redirects to login if user is not authenticated
 * @returns User profile if authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * Check if user has admin role (server-side)
 * @returns true if user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser()
  return user?.role === 'admin'
}

/**
 * Require admin role (server-side)
 * Redirects to home if user is not an admin
 * @returns User profile if authenticated and admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    redirect('/')
  }
  return user
}

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
 * Creates records in both auth.users and public.users tables
 * Requires email confirmation by default
 */
export async function signUp(data: SignUpData): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient()
    
    // Create auth user
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

    // Create public.users profile
    // Note: This will only succeed after email is confirmed if email confirmation is enabled
    const userProfileData: UserInsert = {
      id: authData.user.id,
      email: data.email,
      full_name: data.fullName || null,
      role: 'admin', // Default role for new signups
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert(userProfileData)
      .select()
      .single()

    // If profile creation fails due to email not being confirmed yet, that's okay
    // The profile will be created when they confirm their email
    if (profileError && !requiresEmailConfirmation) {
      console.error('Failed to create user profile:', profileError)
      // Don't fail the signup - they can still log in after confirming email
    }

    return {
      success: true,
      user: authData.user,
      userProfile: userProfile || undefined,
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
 * Also fetches the user profile from public.users
 */
export async function signIn(data: SignInData): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient()
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
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
        error: 'Authentication failed',
      }
    }

    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    // If user profile doesn't exist, create it (handles edge case of email confirmation)
    if (profileError || !userProfile) {
      const newProfile: UserInsert = {
        id: authData.user.id,
        email: authData.user.email!,
        full_name: authData.user.user_metadata?.full_name || null,
        role: 'admin',
      }

      const { data: createdProfile } = await supabase
        .from('users')
        .insert(newProfile)
        .select()
        .single()

      return {
        success: true,
        user: authData.user,
        userProfile: createdProfile || undefined,
      }
    }

    return {
      success: true,
      user: authData.user,
      userProfile,
    }
  } catch (error) {
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

