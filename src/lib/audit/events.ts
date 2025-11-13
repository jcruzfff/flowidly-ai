import { createClient } from '@/lib/supabase/server'
import type { ProposalEventInsert } from '@/types/database'

/**
 * Event types for proposal audit trail
 */
export const EventType = {
  CREATED: 'CREATED',
  PUBLISHED: 'PUBLISHED',
  VIEWED: 'VIEWED',
  ACCEPTED: 'ACCEPTED',
  SIGNED: 'SIGNED',
  PAID: 'PAID',
  BACKUP_CREATED: 'BACKUP_CREATED',
  EMAIL_SENT: 'EMAIL_SENT',
  LINK_REGENERATED: 'LINK_REGENERATED',
  EDITED: 'EDITED',
} as const

export type EventTypeKey = keyof typeof EventType

/**
 * Record a proposal event in the audit trail
 * @param proposalId - The proposal ID
 * @param eventType - Type of event
 * @param eventData - Additional event-specific data
 * @param metadata - User/request metadata
 */
export async function recordProposalEvent(
  proposalId: string,
  eventType: EventTypeKey,
  eventData: Record<string, any> = {},
  metadata?: {
    userEmail?: string
    userName?: string
    userCompany?: string
    ipAddress?: string
    userAgent?: string
  }
) {
  try {
    const supabase = await createClient()

    const event: ProposalEventInsert = {
      proposal_id: proposalId,
      event_type: eventType,
      event_data: eventData,
      user_email: metadata?.userEmail || null,
      user_name: metadata?.userName || null,
      user_company: metadata?.userCompany || null,
      ip_address: metadata?.ipAddress || null, // INET type in DB
      user_agent: metadata?.userAgent || null,
      session_id: null, // Optional: can add session tracking later
      referrer: null, // Optional: can add referrer tracking later
    }

    const { error } = await supabase
      .from('proposal_events')
      .insert(event)

    if (error) {
      console.error('Error recording proposal event:', error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to record proposal event:', error)
    return { success: false, error }
  }
}

/**
 * Get all events for a proposal (for audit trail display)
 * @param proposalId - The proposal ID
 */
export async function getProposalEvents(proposalId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('proposal_events')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching proposal events:', error)
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Failed to fetch proposal events:', error)
    return { data: null, error }
  }
}

/**
 * Extract IP address from request headers
 */
export function getIpAddress(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIp || undefined
}

/**
 * Extract user agent from request headers
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}

