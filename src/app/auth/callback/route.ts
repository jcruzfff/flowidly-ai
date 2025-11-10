import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth callback route handler
 * Handles email confirmation and OAuth redirects
 * Profile is automatically created by database trigger
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/proposals'

  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
    }

    if (user) {
      console.log('✅ [auth/callback] User authenticated:', user.email)
      console.log('🔄 [auth/callback] Redirecting to:', next)
      
      // Profile is automatically created by database trigger
      // No need to manually create it here
      
      // Redirect to the next URL or dashboard
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}

