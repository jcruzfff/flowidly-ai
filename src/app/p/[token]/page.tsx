import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { validateToken } from '@/lib/utils/tokens'
import ProposalView from '@/components/ProposalView'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ token: string }>
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const supabase = await createClient()
  
  const { data: proposal } = await supabase
    .from('proposals')
    .select('title, client_name, client_company')
    .eq('access_token', token)
    .single()

  if (!proposal) {
    return {
      title: 'Proposal Not Found',
    }
  }

  const clientInfo = proposal.client_company || proposal.client_name || 'Client'
  
  return {
    title: `${proposal.title} - ${clientInfo}`,
    description: `View your proposal from Flowidly`,
    openGraph: {
      title: `${proposal.title}`,
      description: `Proposal for ${clientInfo}`,
      type: 'website',
    },
  }
}

/**
 * Public proposal viewing page
 * Accessible via /p/[token] - no authentication required
 */
export default async function PublicProposalPage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  console.log('🔍 [Public View] Looking for proposal with token:', token)

  // First, check if the proposal exists at all (without RLS)
  const { data: checkProposal, error: checkError } = await supabase
    .from('proposals')
    .select('id, access_token, is_template, token_expires_at, status')
    .eq('access_token', token)
    .maybeSingle()

  console.log('🔍 [Check Query] Result:', checkProposal)
  console.log('🔍 [Check Query] Error:', checkError)

  // Now fetch with full data
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      *,
      proposal_sections (
        id,
        proposal_id,
        display_order,
        content
      )
    `)
    .eq('access_token', token)
    .eq('is_template', false)
    .single()

  console.log('📄 [Full Query] Proposal:', proposal)
  console.log('❌ [Full Query] Error:', error)

  // Handle not found or error
  if (error || !proposal) {
    console.error('❌ Proposal not found. Error details:', JSON.stringify(error, null, 2))
    notFound()
  }

  // Validate token expiration
  const validation = validateToken(proposal.access_token, proposal.token_expires_at)
  
  if (!validation.isValid) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-error-bg rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Link Expired</h1>
          <p className="text-text-secondary">
            {validation.error || 'This proposal link has expired.'}
          </p>
          <p className="text-sm text-text-muted">
            Please contact the sender for a new link.
          </p>
        </div>
      </div>
    )
  }

  // Track view event (fire and forget - don't block rendering)
  // This will update the status to 'viewed' if it's currently 'sent'
  trackProposalView(proposal.id).catch(console.error)

  return <ProposalView proposal={proposal} />
}

/**
 * Track proposal view event
 * Updates status to 'viewed' on first view and records event in audit trail
 */
async function trackProposalView(proposalId: string) {
  try {
    const supabase = await createClient()
    const { recordProposalEvent } = await import('@/lib/audit/events')
    
    // Get current proposal status
    const { data: proposal } = await supabase
      .from('proposals')
      .select('status, viewed_at, client_name, client_email, client_company')
      .eq('id', proposalId)
      .single()

    // Record VIEWED event in audit trail (every view)
    await recordProposalEvent(
      proposalId,
      'VIEWED',
      {
        view_number: proposal?.viewed_at ? 'repeat' : 'first',
      },
      {
        userEmail: proposal?.client_email || undefined,
        userName: proposal?.client_name || undefined,
        userCompany: proposal?.client_company || undefined,
      }
    )

    // Only update status if this is the first view
    if (proposal && !proposal.viewed_at && (proposal.status === 'sent' || proposal.status === 'draft')) {
      await supabase
        .from('proposals')
        .update({
          status: 'viewed',
          viewed_at: new Date().toISOString(),
        })
        .eq('id', proposalId)
    }
  } catch (error) {
    console.error('Error tracking proposal view:', error)
  }
}

