'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { signUp, validatePassword, getPasswordStrength } from '@/lib/supabase/auth-client'

export default function SignupPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [requiresConfirmation, setRequiresConfirmation] = useState(false)

  const passwordStrength = password ? getPasswordStrength(password) : 0
  const passwordValidationError = password ? validatePassword(password) : undefined

  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-error'
    if (strength <= 2) return 'bg-warning'
    if (strength <= 3) return 'bg-accent-primary'
    return 'bg-success'
  }

  const getStrengthText = (strength: number) => {
    if (strength === 0) return ''
    if (strength <= 1) return 'Very Weak'
    if (strength <= 2) return 'Weak'
    if (strength <= 3) return 'Good'
    return 'Strong'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    // Password validation
    const validationError = validatePassword(password)
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const result = await signUp({
        email,
        password,
        fullName,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create account. Please try again.')
        setLoading(false)
        return
      }

      // Success
      setShowSuccess(true)
      setRequiresConfirmation(result.requiresEmailConfirmation || false)

      if (!result.requiresEmailConfirmation) {
        // Auto sign-in was successful, redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (showSuccess) {
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-text-primary">
                {requiresConfirmation ? 'Check Your Email' : 'Account Created!'}
              </h2>
              
              {requiresConfirmation ? (
                <p className="text-text-secondary">
                  We've sent a confirmation link to <strong>{email}</strong>.
                  Please check your email and click the link to activate your account.
                </p>
              ) : (
                <p className="text-text-secondary">
                  Your account has been created successfully. Redirecting you to the dashboard...
                </p>
              )}
            </div>

            {requiresConfirmation && (
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push('/login')}
                className="mt-4"
              >
                Go to Login
              </Button>
            )}
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
            FREE ACCOUNT
          </Badge>
          
          <h1 className="text-4xl font-bold gradient-heading">
            Create Account
          </h1>
          
          <p className="text-text-secondary">
            Get started with Flowidly today
          </p>
        </div>

        {/* Signup Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-error-bg border border-error-border text-error p-4 rounded-md text-sm">
                <strong className="font-semibold">Error:</strong> {error}
              </div>
            )}

            {/* Full Name Input */}
            <Input
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              autoComplete="name"
              required
            />

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
            <div>
              <PasswordInput
                label="Password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                error={passwordValidationError}
                required
              />
              
              {/* Password Strength Indicator */}
              {password && !passwordValidationError && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength
                            ? getStrengthColor(passwordStrength)
                            : 'bg-border-default'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength <= 1 ? 'text-error' :
                    passwordStrength <= 2 ? 'text-warning' :
                    passwordStrength <= 3 ? 'text-accent-primary' :
                    'text-success'
                  }`}>
                    Password strength: {getStrengthText(passwordStrength)}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <PasswordInput
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              error={
                confirmPassword && password !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
              required
            />

            {/* Terms Agreement */}
            <p className="text-xs text-text-muted">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-accent-primary hover:text-accent-hover">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-accent-primary hover:text-accent-hover">
                Privacy Policy
              </Link>
              .
            </p>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={loading || !!passwordValidationError}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </Card>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-accent-primary hover:text-accent-hover font-medium transition-colors"
            >
              Sign in
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

