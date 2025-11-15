'use client'

import { ProposalUnified, ProposalSectionUnified } from '@/types/database'
import Badge from './ui/Badge'
import PricingTable from './PricingTable'

type ProposalViewProps = {
  proposal: ProposalUnified & {
    proposal_sections?: ProposalSectionUnified[]
  }
}

/**
 * Public proposal view component
 * Renders proposal content in read-only mode for clients
 */
export default function ProposalView({ proposal }: ProposalViewProps) {
  // Sort sections by order
  const sections = (proposal.proposal_sections || []).sort(
    (a, b) => a.display_order - b.display_order
  )

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Header */}
      <header className="border-b border-border-default bg-bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                {proposal.title || 'Untitled Proposal'}
              </h1>
              {proposal.client_company && (
                <p className="text-sm text-text-secondary mt-1">
                  For: {proposal.client_company}
                </p>
              )}
            </div>
            <Badge variant={getStatusVariant(proposal.status)}>
              {getStatusLabel(proposal.status)}
            </Badge>
          </div>
        </div>
      </header>

      {/* Proposal Content - Full Width */}
      <main className="w-full">
        {sections.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-bg-hover rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-text-muted"
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
            <p className="text-text-secondary">This proposal is empty.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {sections.map((section) => (
              <ProposalBlock
                key={section.id}
                section={section}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-default bg-bg-card mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-text-muted">
            Powered by{' '}
            <a
              href="https://flowidly.com"
              className="text-accent-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Flowidly
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

/**
 * Individual proposal block/section
 */
function ProposalBlock({ section }: { section: ProposalSectionUnified }) {
  const content = section.content as { elements?: any[]; background_color?: string }
  const elements = content?.elements || []
  const backgroundColor = content?.background_color || 'transparent'

  if (elements.length === 0) {
    return null
  }

  return (
    <div
      className="w-full py-16 px-8"
      style={{ backgroundColor }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {elements.map((element: any) => (
          <ProposalElement key={element.id} element={element} />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual element within a block
 */
function ProposalElement({ element }: { element: any }) {
  const { type, content } = element

  switch (type) {
    case 'text':
      return (
        <div
          className="w-full text-text-primary [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:mb-3 [&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-2"
          dangerouslySetInnerHTML={{ __html: content.html || '' }}
        />
      )

    case 'button':
      return (
        <div className="flex justify-center my-6">
          <a
            href={content.buttonUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 bg-accent-primary hover:bg-accent-hover text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
            style={{
              backgroundColor: content.buttonColor || undefined,
            }}
          >
            {content.buttonText || 'Button'}
          </a>
        </div>
      )

    case 'image':
      if (!content.imageUrl) return null
      return (
        <div className="flex justify-center my-8">
          <img
            src={content.imageUrl}
            alt={content.imageAlt || 'Image'}
            className="max-w-full h-auto rounded-lg shadow-md"
          />
        </div>
      )

    case 'video':
      if (!content.videoUrl) return null
      return (
        <div className="aspect-video my-8">
          <iframe
            src={content.videoUrl}
            className="w-full h-full rounded-lg shadow-md"
            allowFullScreen
            title="Video"
          />
        </div>
      )

    case 'divider':
      return <hr className="border-border-default my-12" />

    case 'pricing':
      return <PricingTable content={content} />

    default:
      return null
  }
}

/**
 * Get badge variant based on proposal status
 */
function getStatusVariant(status: string | null): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'draft':
      return 'default'
    case 'sent':
      return 'info'
    case 'viewed':
      return 'warning'
    case 'accepted':
      return 'success'
    case 'signed':
      return 'success'
    case 'paid':
      return 'success'
    default:
      return 'default'
  }
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status: string | null): string {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'sent':
      return 'Sent'
    case 'viewed':
      return 'Viewed'
    case 'accepted':
      return 'Accepted'
    case 'signed':
      return 'Signed'
    case 'paid':
      return 'Paid'
    default:
      return 'Unknown'
  }
}

