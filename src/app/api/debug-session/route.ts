import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🔍 [DEBUG] API route called')
  
  const supabase = await createClient()
  
  console.log('🔍 [DEBUG] Supabase client created')
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('🔍 [DEBUG] User:', user?.email || 'None')
  console.log('🔍 [DEBUG] Error:', error?.message || 'None')
  
  if (user) {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    console.log('🔍 [DEBUG] Profile:', profile)
    console.log('🔍 [DEBUG] Profile Error:', profileError?.message || 'None')
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at,
      },
      profile,
      profileError: profileError?.message || null,
    })
  }
  
  return NextResponse.json({
    authenticated: false,
    error: error?.message || 'No user found',
  })
}

