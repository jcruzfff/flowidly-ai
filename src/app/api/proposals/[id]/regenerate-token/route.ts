import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateSecureToken, generateTokenExpiration } from '@/lib/utils/tokens'

/**
 * POST /api/proposals/[id]/regenerate-token
 * Regenerate the access token for a proposal
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const proposalId = params.id

  // Verify the proposal exists and belongs to the user
  const { data: proposal, error: fetchError } = await supabase
    .from('proposals')
    .select('id, created_by, is_template')
    .eq('id', proposalId)
    .single()

  if (fetchError || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
  }

  if (proposal.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (proposal.is_template) {
    return NextResponse.json(
      { error: 'Cannot regenerate token for templates' },
      { status: 400 }
    )
  }

  // Generate new token and expiration
  const newToken = generateSecureToken()
  const newExpiration = generateTokenExpiration(30) // 30 days

  // Update the proposal with new token
  const { data, error: updateError } = await supabase
    .from('proposals')
    .update({
      access_token: newToken,
      token_expires_at: newExpiration,
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId)
    .select()
    .single()

  if (updateError) {
    console.error('Error regenerating token:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      message: 'Token regenerated successfully',
      proposal: data,
    },
    { status: 200 }
  )
}

