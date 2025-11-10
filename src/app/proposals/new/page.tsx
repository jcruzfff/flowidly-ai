'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { getUserClient } from '@/lib/supabase/auth-client'

export default function NewProposalPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientCompany, setClientCompany] = useState('')

  useEffect(() => {
    const init = async () => {
      const currentUser = await getUserClient()
      setUser(currentUser)
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          is_template: false,
          client_name: clientName.trim() || null,
          client_email: clientEmail.trim() || null,
          client_company: clientCompany.trim() || null,
          status: 'draft',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create page')
      }

      const data = await response.json()
      const newProposalId = data.proposal.id

      // Redirect to the editor for the new proposal
      router.push(`/proposals/${newProposalId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page')
      setLoading(false)
    }
  }

  return (
    <AppLayout user={user}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/proposals">
            <Button variant="ghost" size="sm" className="mb-4">
              ← Back to Pages
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Create a New Page
          </h1>
          <p className="text-text-secondary">
            Start with a blank page and add sections as you go
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title - Required */}
            <div>
              <Input
                label="Page Title"
                placeholder="e.g., Marketing Proposal for Acme Corp"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs text-text-muted mt-1">
                Give your page a descriptive title
              </p>
            </div>

            {/* Client Details Section */}
            <div className="pt-4 border-t border-border-default">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Client Information
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Optional: Add client details to organize your pages
              </p>

              <div className="space-y-4">
                <Input
                  label="Client Name"
                  placeholder="e.g., John Smith"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />

                <Input
                  label="Client Email"
                  type="email"
                  placeholder="e.g., john@acmecorp.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />

                <Input
                  label="Client Company"
                  placeholder="e.g., Acme Corp"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-md bg-error/10 border border-error/20">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border-default">
              <Link href="/proposals">
                <Button variant="ghost" size="md" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading || !title.trim()}
              >
                {loading ? 'Creating...' : 'Create Page'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Help Text */}
        <div className="mt-6 p-4 rounded-md bg-accent-light/20 border border-accent-light/30">
          <p className="text-sm text-text-secondary">
            💡 <strong>Tip:</strong> After creating your page, you'll be able to add sections like hero images, 
            text blocks, pricing tables, and more. You can also save any page as a template for future use.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}

