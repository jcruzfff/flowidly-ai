'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import PasswordInput from '@/components/ui/PasswordInput'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { updatePassword, validatePassword, getPasswordStrength } from '@/lib/supabase/auth-client'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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
    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
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
      const result = await updatePassword(password)

      if (!result.success) {
        setError(result.error || 'Failed to reset password. Please try again.')
        setLoading(false)
        return
      }

      // Success
      setSuccess(true)
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-text-primary">
                Password Updated!
              </h2>
              
              <p className="text-text-secondary">
                Your password has been successfully reset. Redirecting you to the dashboard...
              </p>
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
            RESET PASSWORD
          </Badge>
          
          <h1 className="text-4xl font-bold gradient-heading">
            Create New Password
          </h1>
          
          <p className="text-text-secondary">
            Enter your new password below
          </p>
        </div>

        {/* Reset Password Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-error-bg border border-error-border text-error p-4 rounded-md text-sm">
                <strong className="font-semibold">Error:</strong> {error}
              </div>
            )}

            {/* Password Input */}
            <div>
              <PasswordInput
                label="New Password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                error={passwordValidationError}
                autoFocus
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
              label="Confirm New Password"
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

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={loading || !!passwordValidationError}
            >
              {loading ? 'Resetting password...' : 'Reset Password'}
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

