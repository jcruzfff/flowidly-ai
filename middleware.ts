import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware for route protection and session management
 * Protects /dashboard and /proposals routes
 * Refreshes user sessions automatically
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // This will automatically refresh the session if needed
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  console.log('🛡️ [middleware] ==================')
  console.log('🛡️ [middleware] Path:', path)
  console.log('🛡️ [middleware] User:', user?.email || 'Not authenticated')
  console.log('🛡️ [middleware] User ID:', user?.id || 'None')
  console.log('🛡️ [middleware] Auth Error:', userError?.message || 'None')
  
  // Log cookies for debugging
  const cookies = request.cookies.getAll()
  const authCookies = cookies.filter(c => c.name.includes('auth'))
  console.log('🛡️ [middleware] Auth cookies:', authCookies.length, 'found')

  // Protected routes that require authentication
  const isProtectedRoute =
    path.startsWith('/dashboard') || path.startsWith('/proposals')

  // Auth routes that authenticated users shouldn't access
  const isAuthRoute =
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/auth/reset-password')

  console.log('🔍 [middleware] Route checks:', { isProtectedRoute, isAuthRoute, hasUser: !!user })

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    console.log('🚫 [middleware] Blocked! Redirecting to login')
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    // Preserve the original URL as a redirect parameter
    redirectUrl.searchParams.set('redirectTo', path)
    
    const response = NextResponse.redirect(redirectUrl)
    // Add debug headers
    response.headers.set('X-Auth-Status', 'blocked-no-user')
    response.headers.set('X-Auth-Cookies', authCookies.length.toString())
    return response
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    console.log('✅ [middleware] User authenticated, redirecting from auth page')
    const redirectUrl = request.nextUrl.clone()
    // Check if there's a redirectTo parameter
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    redirectUrl.pathname = redirectTo || '/dashboard'
    redirectUrl.searchParams.delete('redirectTo')
    console.log('🔄 [middleware] Redirecting to:', redirectUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check user role for admin routes
  if (path.startsWith('/dashboard') && user) {
    console.log('🔐 [middleware] Checking admin role for dashboard access')
    // Fetch user profile to check role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('👤 [middleware] User profile:', userProfile)

    // If no user profile exists or user is not admin, redirect to home
    if (!userProfile || userProfile.role !== 'admin') {
      console.log('🚫 [middleware] Access denied - not an admin')
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
    
    console.log('✅ [middleware] Admin access granted')
  }

  console.log('✅ [middleware] Request allowed to proceed')
  // Add debug headers for successful requests
  supabaseResponse.headers.set('X-Auth-Status', user ? 'authenticated' : 'public')
  supabaseResponse.headers.set('X-Auth-User', user?.email || 'none')
  supabaseResponse.headers.set('X-Auth-Cookies', authCookies.length.toString())
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

