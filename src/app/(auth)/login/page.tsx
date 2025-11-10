'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { signIn } from '@/lib/supabase/auth-client'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('🔐 Login attempt started', { email, redirectTo })

    // Basic validation
    if (!email || !password) {
      console.log('❌ Validation failed: Missing fields')
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      console.log('❌ Validation failed: Invalid email format')
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      console.log('📡 Calling signIn function...')
      const result = await signIn({ email, password })
      console.log('📥 signIn result:', result)

      if (!result.success) {
        console.log('❌ Sign in failed:', result.error)
        setError(result.error || 'Failed to sign in. Please try again.')
        setLoading(false)
        return
      }

      console.log('✅ Sign in successful! Redirecting to:', redirectTo)
      console.log('👤 User:', result.user?.email)
      
      // Use full page navigation to ensure cookies are properly set
      console.log('🔄 Waiting for cookies to persist...')
      
      // Small delay to let cookies propagate
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('🔄 Performing full page redirect...')
      window.location.href = redirectTo
    } catch (err) {
      console.error('💥 Unexpected error during login:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge variant="info" size="md" className="mx-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mr-2"></span>
            SECURE LOGIN
          </Badge>
          
          <h1 className="text-4xl font-bold gradient-heading">
            Welcome Back
          </h1>
          
          <p className="text-text-secondary">
            Sign in to your Flowidly account
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-error-bg border border-error-border text-error p-4 rounded-md text-sm">
                <strong className="font-semibold">Error:</strong> {error}
              </div>
            )}

            {/* Email Input */}
            <Input
              type="email"
              label="Email Address"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              required
            />

            {/* Password Input */}
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-accent-primary hover:text-accent-hover transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="text-accent-primary hover:text-accent-hover font-medium transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

