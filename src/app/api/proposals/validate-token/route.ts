import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { validateToken } from '@/lib/utils/tokens'

/**
 * POST /api/proposals/validate-token
 * Validate a proposal access token
 * This endpoint is public (no auth required) for client access
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { token } = await request.json()

  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'Token is required' },
      { status: 400 }
    )
  }

  // Fetch proposal by token
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, title, status, access_token, token_expires_at, is_template')
    .eq('access_token', token)
    .single()

  if (error || !proposal) {
    return NextResponse.json(
      { valid: false, error: 'Invalid token' },
      { status: 404 }
    )
  }

  // Check if it's a template (templates shouldn't have public access)
  if (proposal.is_template) {
    return NextResponse.json(
      { valid: false, error: 'Invalid token' },
      { status: 404 }
    )
  }

  // Validate token expiration
  const validation = validateToken(proposal.access_token, proposal.token_expires_at)

  if (!validation.isValid) {
    return NextResponse.json(
      { valid: false, error: validation.error },
      { status: 403 }
    )
  }

  // Token is valid
  return NextResponse.json(
    {
      valid: true,
      proposal: {
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
      },
    },
    { status: 200 }
  )
}

