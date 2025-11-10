'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { resetPassword } from '@/lib/supabase/auth-client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const result = await resetPassword(email)

      if (!result.success) {
        setError(result.error || 'Failed to send reset email. Please try again.')
        setLoading(false)
        return
      }

      // Success
      setSuccess(true)
      setLoading(false)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main p-6">
        <div className="max-w-md w-full space-y-8">
          <Card className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-success-bg rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-text-primary">
                Check Your Email
              </h2>
              
              <p className="text-text-secondary">
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your email and click the link to reset your password.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-sm text-text-muted">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
              >
                Send Another Email
              </Button>
            </div>

            <div className="pt-4 border-t border-border-default">
              <Link href="/login">
                <Button variant="secondary" size="md" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge variant="info" size="md" className="mx-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mr-2"></span>
            PASSWORD RESET
          </Badge>
          
          <h1 className="text-4xl font-bold gradient-heading">
            Forgot Password?
          </h1>
          
          <p className="text-text-secondary">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        {/* Reset Form Card */}
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
              autoFocus
              required
            />

            <p className="text-xs text-text-muted">
              We'll send you an email with instructions to reset your password.
              The link will be valid for 1 hour.
            </p>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </Card>

        {/* Back to Login Link */}
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Remember your password?{' '}
            <Link
              href="/login"
              className="text-accent-primary hover:text-accent-hover font-medium transition-colors"
            >
              Back to login
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

