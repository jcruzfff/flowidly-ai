'use client'

import { useEffect, useState } from 'react'
import Card from './ui/Card'
import Badge from './ui/Badge'
import type { ProposalEvent } from '@/types/database'

type AuditTrailProps = {
  proposalId: string
}

/**
 * Audit Trail Component - Qwilr-style timeline
 * Shows complete lifecycle of a proposal
 */
export default function AuditTrail({ proposalId }: AuditTrailProps) {
  const [events, setEvents] = useState<ProposalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [proposalId])

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/events`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }

      const data = await response.json()
      setEvents(data.events || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit trail')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Audit Trail</h2>
        <p className="text-sm text-text-secondary">Loading events...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Audit Trail</h2>
        <p className="text-sm text-error">{error}</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-1">Audit Trail</h2>
        <p className="text-sm text-text-secondary">
          A record of this proposal's lifecycle
        </p>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">No events recorded yet</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border-default" />

          {/* Events */}
          <div className="space-y-6">
            {events.map((event, index) => (
              <EventItem
                key={event.id}
                event={event}
                isFirst={index === 0}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

/**
 * Individual event item in the timeline
 */
function EventItem({ event, isFirst }: { event: ProposalEvent; isFirst: boolean }) {
  const eventConfig = getEventConfig(event.event_type)
  const eventData = event.event_data as Record<string, any>

  return (
    <div className="relative flex gap-4 items-start">
      {/* Icon */}
      <div
        className={`
          relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
          ${eventConfig.bgColor}
        `}
      >
        {eventConfig.icon}
      </div>

      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-medium text-text-primary">{eventConfig.title}</h3>
          {isFirst && (
            <Badge variant="info" size="sm">Latest</Badge>
          )}
        </div>

        <p className="text-sm text-text-secondary mb-2">
          {formatDate(event.created_at)}
        </p>

        {/* Event details */}
        <div className="text-sm space-y-1">
          {event.user_email && (
            <div className="flex items-center gap-2 text-text-muted">
              <span className="font-medium">Email:</span>
              <span>{event.user_email}</span>
            </div>
          )}

          {event.user_name && (
            <div className="flex items-center gap-2 text-text-muted">
              <span className="font-medium">Name:</span>
              <span>{event.user_name}</span>
            </div>
          )}

          {event.user_company && (
            <div className="flex items-center gap-2 text-text-muted">
              <span className="font-medium">Company:</span>
              <span>{event.user_company}</span>
            </div>
          )}

          {event.ip_address && (
            <div className="flex items-center gap-2 text-text-muted">
              <span className="font-medium">IP:</span>
              <span className="font-mono text-xs">{event.ip_address}</span>
            </div>
          )}

          {/* Event-specific data */}
          {eventData && Object.keys(eventData).length > 0 && (
            <div className="mt-2 p-2 bg-bg-secondary rounded text-xs text-text-muted">
              {renderEventData(event.event_type, eventData)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Get configuration for each event type
 */
function getEventConfig(eventType: string) {
  const configs: Record<string, { title: string; icon: JSX.Element; bgColor: string }> = {
    CREATED: {
      title: 'Proposal Created',
      bgColor: 'bg-bg-secondary',
      icon: (
        <svg className="w-6 h-6 text-accent-primary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    PUBLISHED: {
      title: 'Published Page',
      bgColor: 'bg-accent-light',
      icon: (
        <svg className="w-6 h-6 text-accent-primary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
    },
    VIEWED: {
      title: 'Page Viewed',
      bgColor: 'bg-info-bg',
      icon: (
        <svg className="w-6 h-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    ACCEPTED: {
      title: 'Signed & Accepted',
      bgColor: 'bg-success-bg',
      icon: (
        <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    SIGNED: {
      title: 'E-Signature Captured',
      bgColor: 'bg-success-bg',
      icon: (
        <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    PAID: {
      title: 'Payment Received',
      bgColor: 'bg-success-bg',
      icon: (
        <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    BACKUP_CREATED: {
      title: 'Audit Backup',
      bgColor: 'bg-bg-secondary',
      icon: (
        <svg className="w-6 h-6 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    EMAIL_SENT: {
      title: 'Emailed Copy',
      bgColor: 'bg-bg-secondary',
      icon: (
        <svg className="w-6 h-6 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    LINK_REGENERATED: {
      title: 'Link Regenerated',
      bgColor: 'bg-warning-bg',
      icon: (
        <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    EDITED: {
      title: 'Content Edited',
      bgColor: 'bg-bg-secondary',
      icon: (
        <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
  }

  return configs[eventType] || {
    title: eventType,
    bgColor: 'bg-bg-secondary',
    icon: (
      <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }
}

/**
 * Render event-specific data
 */
function renderEventData(eventType: string, data: Record<string, any>) {
  if (eventType === 'VIEWED') {
    return (
      <div>
        <span className="font-medium">View type:</span> {data.view_number === 'first' ? 'First view' : 'Repeat view'}
      </div>
    )
  }

  if (eventType === 'CREATED') {
    return (
      <div className="space-y-1">
        {data.title && <div><span className="font-medium">Title:</span> {data.title}</div>}
        {data.client_name && <div><span className="font-medium">Client:</span> {data.client_name}</div>}
      </div>
    )
  }

  // Generic fallback
  return (
    <pre className="whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }
}

