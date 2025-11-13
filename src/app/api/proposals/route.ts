import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ProposalUnifiedInsert } from '@/types/database'
import { generateSecureToken, generateTokenExpiration } from '@/lib/utils/tokens'
import { recordProposalEvent, getIpAddress, getUserAgent } from '@/lib/audit/events'

/**
 * GET /api/proposals
 * List all proposals (not templates) for the authenticated user
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const includeTemplates = searchParams.get('include_templates') === 'true'

  const query = supabase
    .from('proposals')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  if (!includeTemplates) {
    query.eq('is_template', false)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ proposals: data }, { status: 200 })
}

/**
 * POST /api/proposals
 * Create a new proposal or template
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, is_template, client_name, client_email, client_company } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  // Generate secure access token and expiration for non-template proposals
  const accessToken = is_template ? null : generateSecureToken()
  const tokenExpiration = is_template ? null : generateTokenExpiration(30) // 30 days

  const newProposal: ProposalUnifiedInsert = {
    created_by: user.id,
    title,
    is_template: is_template || false,
    client_name,
    client_email,
    client_company,
    status: is_template ? null : 'draft',
    access_token: accessToken,
    token_expires_at: tokenExpiration,
  }

  const { data, error } = await supabase
    .from('proposals')
    .insert(newProposal)
    .select()
    .single()

  if (error) {
    console.error('Error creating proposal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Record CREATED event in audit trail
  const ipAddress = getIpAddress(request)
  const userAgent = getUserAgent(request)
  
  await recordProposalEvent(
    data.id,
    'CREATED',
    {
      title: data.title,
      is_template: data.is_template,
      client_name: data.client_name,
    },
    {
      userEmail: user.email,
      ipAddress,
      userAgent,
    }
  )

  return NextResponse.json({ proposal: data }, { status: 201 })
}

