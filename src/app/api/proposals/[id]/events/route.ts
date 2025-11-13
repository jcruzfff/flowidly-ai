import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { recordProposalEvent, getProposalEvents, getIpAddress, getUserAgent } from '@/lib/audit/events'

type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/proposals/[id]/events
 * Get all audit trail events for a proposal
 */
export async function GET(request: Request, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: proposalId } = await params

  // Verify user owns the proposal
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id')
    .eq('id', proposalId)
    .eq('created_by', user.id)
    .single()

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
  }

  const { data, error } = await getProposalEvents(proposalId)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }

  return NextResponse.json({ events: data }, { status: 200 })
}

/**
 * POST /api/proposals/[id]/events
 * Record a new event in the audit trail
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { eventType, eventData, metadata } = body

    if (!eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 })
    }

    const { id: proposalId } = await params

    // Extract request metadata
    const ipAddress = getIpAddress(request)
    const userAgent = getUserAgent(request)

    const result = await recordProposalEvent(
      proposalId,
      eventType,
      eventData || {},
      {
        ...metadata,
        ipAddress,
        userAgent,
      }
    )

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Event recorded successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/proposals/[id]/events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

