'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { TrashIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/outline'

type Proposal = {
  id: string
  title: string
  client_name: string | null
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'paid' | null
  view_count: number
  created_at: string
  updated_at: string
}

export default function ProposalsPage() {
  const router = useRouter()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProposals()
  }, [])

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/proposals')
      if (!response.ok) {
        throw new Error('Failed to fetch proposals')
      }
      const data = await response.json()
      setProposals(data.proposals || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete proposal')
      }

      fetchProposals() // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete proposal')
    }
  }

  if (loading) {
    return (
      <AppLayout user={null}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="p-8 text-center">Loading proposals...</Card>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout user={null}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="p-8 text-center text-error">Error: {error}</Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={null}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Pages
          </h1>
          <p className="text-text-secondary">
            All your proposals in one place
          </p>
        </div>

        {/* Qwilr-style Proposals List */}
        {proposals.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-accent-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-text-primary">
                No pages yet
              </h2>
              <p className="text-text-secondary">
                Create your first proposal from scratch or using a template
              </p>
            </div>
          </Card>
        ) : (
          <div className="border border-border-default rounded-lg overflow-hidden bg-bg-card">
            {proposals.map((proposal, index) => (
              <Link
                key={proposal.id}
                href={`/proposals/${proposal.id}`}
                className={`
                  flex items-center gap-4 p-4 hover:bg-bg-hover transition-colors
                  ${index !== proposals.length - 1 ? 'border-b border-border-default' : ''}
                `}
              >
                {/* Left: Checkbox placeholder */}
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 border-2 border-border-default rounded"></div>
                </div>

                {/* Middle: Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-medium text-text-primary truncate">
                      {proposal.title}
                    </h3>
                    {proposal.client_name && (
                      <>
                        <span className="text-text-muted">•</span>
                        <span className="text-sm text-text-secondary">{proposal.client_name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <div className="flex items-center gap-1">
                      <EyeIcon className="w-4 h-4" />
                      <span>{proposal.view_count} {proposal.view_count === 1 ? 'view' : 'views'}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>Edited {new Date(proposal.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Status + Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge
                    variant={
                      proposal.status === 'draft'
                        ? 'info'
                        : proposal.status === 'sent'
                        ? 'warning'
                        : proposal.status === 'viewed'
                        ? 'info'
                        : proposal.status === 'accepted'
                        ? 'success'
                        : 'info'
                    }
                    size="sm"
                  >
                    {proposal.status ? proposal.status.toUpperCase() : 'DRAFT'}
                  </Badge>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDelete(proposal.id, proposal.title)
                    }}
                    className="p-1.5 hover:bg-bg-secondary rounded transition-colors"
                    aria-label="Delete proposal"
                  >
                    <TrashIcon className="w-4 h-4 text-text-muted hover:text-error" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

